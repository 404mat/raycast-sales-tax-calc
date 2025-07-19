import { ActionPanel, Action, List } from "@raycast/api";
import { useState, useEffect } from "react";
import { taxRates } from "./tax-rates";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [amount, setAmount] = useState(0);
  const [regionName, setRegionName] = useState("");
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [regionFound, setRegionFound] = useState(false);

  useEffect(() => {
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
  }, [searchText]);

  useEffect(() => {
    if (amount > 0 && regionName) {
      let found = false;
      for (const country in taxRates) {
        const region = taxRates[country as keyof typeof taxRates]?.find(
          (r) => r.name.toLowerCase() === regionName.toLowerCase(),
        );
        if (region) {
          const calculatedTax = amount * region.tax;
          setTax(calculatedTax);
          setTotal(amount + calculatedTax);
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
            title={`Total: ${total.toFixed(2)}`}
            subtitle={`Amount: ${amount.toFixed(2)} + Tax: ${tax.toFixed(2)}`}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy Total" content={total.toFixed(2)} />
                <Action.CopyToClipboard title="Copy Tax" content={tax.toFixed(2)} />
              </ActionPanel>
            }
          />
          <List.Item
            title="Calculation Breakdown"
            subtitle={`Based on ${regionName}'s tax rate of ${((tax / amount) * 100).toFixed(2)}%`}
          />
        </>
      ) : (
        <List.EmptyView title="e.g., '100 in Quebec' or 'tax for 50 in ON'" />
      )}
    </List>
  );
}
