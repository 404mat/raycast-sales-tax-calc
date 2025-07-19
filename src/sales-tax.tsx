import { ActionPanel, Action, List, LaunchProps, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";
import { taxRates } from "./tax-rates";

type TaxComponent = {
  name: string;
  rate: number;
};

type Region = TaxComponent[];

type CommandProps = LaunchProps<{
  arguments: {
    amount: string;
    region: string;
  };
}>;

type Preferences = {
  defaultCountry: string;
  defaultRegion: string;
};

export default function Command(props: CommandProps) {
  const [searchText, setSearchText] = useState("");
  const [amount, setAmount] = useState(0);
  const [regionName, setRegionName] = useState("");
  const [countryName, setCountryName] = useState("");
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [regionFound, setRegionFound] = useState(false);
  const [taxBreakdown, setTaxBreakdown] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    const { defaultCountry, defaultRegion } = getPreferenceValues<Preferences>();

    if (props.arguments?.amount) {
      const parsedAmount = parseFloat(props.arguments.amount);
      if (!isNaN(parsedAmount)) {
        setAmount(parsedAmount);
      }
    }

    if (props.arguments?.region) {
      setRegionName(props.arguments.region.trim());
    } else {
      const regex = /(\d+(\.\d+)?)\s*(dollars|in|for)\s*(.+)/i;
      const match = searchText.match(regex);

      if (match) {
        const parsedAmount = parseFloat(match[1]);
        const parsedRegion = match[4];
        if (!isNaN(parsedAmount)) {
          setAmount(parsedAmount);
          setRegionName(parsedRegion.trim());
        }
      } else if (props.arguments.amount) {
        setRegionName(defaultRegion);
        setCountryName(defaultCountry);
      }
    }
  }, [searchText, props.arguments]);

  useEffect(() => {
    if (amount > 0 && regionName) {
      let found = false;
      const searchCountry = countryName ? [countryName] : Object.keys(taxRates);

      for (const country of searchCountry) {
        const regions = taxRates[country as keyof typeof taxRates];
        const regionKey = Object.keys(regions).find((key) => key.toLowerCase() === regionName.toLowerCase());

        if (regionKey) {
          const region = regions[regionKey as keyof typeof regions] as Region;
          const breakdown = region.map((taxComponent: TaxComponent) => ({
            name: taxComponent.name,
            amount: amount * taxComponent.rate,
          }));
          const totalTax = breakdown.reduce((sum: number, tax) => sum + tax.amount, 0);

          setTax(totalTax);
          setTotal(amount + totalTax);
          setTaxBreakdown(breakdown);
          setRegionFound(true);
          found = true;
          break;
        }
      }
      if (!found) {
        setRegionFound(false);
      }
    }
  }, [amount, regionName, countryName]);

  return (
    <List onSearchTextChange={setSearchText} searchText={searchText} throttle>
      {regionFound ? (
        <>
          <List.Item
            title="Total"
            subtitle={total.toFixed(2)}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy Total" content={total.toFixed(2)} />
                <Action.CopyToClipboard title="Copy Tax" content={tax.toFixed(2)} />
              </ActionPanel>
            }
          />
          <List.Item title="Breakdown :" />
          {taxBreakdown.map((t, index) => (
            <List.Item
              key={index}
              title={t.name}
              subtitle={t.amount.toFixed(2)}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title={`Copy ${t.name}`} content={t.amount.toFixed(2)} />
                </ActionPanel>
              }
            />
          ))}
        </>
      ) : (
        <List.EmptyView title="e.g., '100 in Quebec' or 'tax for 50 in ON'" />
      )}
    </List>
  );
}
