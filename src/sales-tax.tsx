import { ActionPanel, Action, List, LaunchProps } from "@raycast/api";
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

export default function Command(props: CommandProps) {
  const [searchText, setSearchText] = useState("");
  const [amount, setAmount] = useState(0);
  const [regionName, setRegionName] = useState("");
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [regionFound, setRegionFound] = useState(false);
  const [taxBreakdown, setTaxBreakdown] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    if (props.arguments?.amount && props.arguments?.region) {
      const parsedAmount = parseFloat(props.arguments.amount);
      if (!isNaN(parsedAmount)) {
        setAmount(parsedAmount);
        setRegionName(props.arguments.region.trim());
      }
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
      }
    }
  }, [searchText, props.arguments]);

  useEffect(() => {
    if (amount > 0 && regionName) {
      let found = false;
      for (const country of Object.keys(taxRates)) {
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
  }, [amount, regionName]);

  return (
    <List onSearchTextChange={setSearchText} searchText={searchText} throttle>
      {regionFound ? (
        <>
          <List.Item
            title="Total"
            accessories={[{ text: total.toFixed(2) }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy Total" content={total.toFixed(2)} />
                <Action.CopyToClipboard title="Copy Tax" content={tax.toFixed(2)} />
              </ActionPanel>
            }
          />
          <List.Item
            title="Added tax"
            subtitle={`${taxBreakdown.map((t) => `${t.name}: ${t.amount.toFixed(2)}`).join(" + ")}`}
          />
        </>
      ) : (
        <List.EmptyView title="e.g., '100 in Quebec' or 'tax for 50 in ON'" />
      )}
    </List>
  );
}
