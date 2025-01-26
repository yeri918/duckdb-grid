import React, { useEffect, useState } from "react";

import type { CustomToolPanelProps } from "ag-grid-react";

const totalStyle = { paddingBottom: "15px" };

export interface CustomSideBarPanelProps extends CustomToolPanelProps {
  title: string;
}

const CustomSideBarPanel = (props: CustomSideBarPanelProps) => {
  const [numMedals, setNumMedals] = useState(0);
  const [numGold, setNumGold] = useState(0);
  const [numSilver, setNumSilver] = useState(0);
  const [numBronze, setNumBronze] = useState(0);

  const updateTotals = () => {
    let numGold = 0,
      numSilver = 0,
      numBronze = 0;

    props.api.forEachNode(function (rowNode) {
      const data = rowNode.data;

      if (data.gold) numGold += data.gold;
      if (data.silver) numSilver += data.silver;
      if (data.bronze) numBronze += data.bronze;
    });

    const numMedals = numGold + numSilver + numBronze;

    setNumMedals(numMedals);
    setNumGold(numGold);
    setNumSilver(numSilver);
    setNumBronze(numBronze);
  };

  useEffect(() => {
    props.api.addEventListener("modelUpdated", updateTotals);

    return () => {
      if (!props.api.isDestroyed()) {
        props.api.removeEventListener("modelUpdated", updateTotals);
      }
    };
  }, []);

  return <div style={{ textAlign: "center" }}>Placeholder</div>;
};

export default CustomSideBarPanel;
