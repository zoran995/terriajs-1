import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterProps } from "react-table";
import debounce from "lodash-es/debounce";
const FilterInput: any = require("../TableStyles").FilterInput;

const DEBOUNCE_INTERVAL = 500;

export default function DefaultColumnFilter<T extends object>({
  column: { id, /* index, */ filterValue, setFilter, render, parent }
}: FilterProps<T>) {
  const [value, setValue] = useState(filterValue || "");
  const debounceSearchTerm = useCallback(
    debounce(setFilter, DEBOUNCE_INTERVAL),
    []
  );

  // ensure that reset loads the new value
  useEffect(() => {
    debounceSearchTerm(value);
  }, [value]);
  const { t } = useTranslation();
  //const firstIndex = !(parent && parent.index);
  return (
    <FilterInput
      name={id}
      value={value}
      //autoFocus={index === 0/*  && firstIndex */}
      placeholder={t("attributeTable.search")}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
      }}
    />
  );
}
