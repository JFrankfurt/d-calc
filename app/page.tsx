"use client";
import {
  Field,
  Fieldset,
  Input,
  Label,
  Tab,
  TabGroup,
  TabList,
} from "@headlessui/react";
import { useState } from "react";

enum DumpsterType {
  FLAT_RATE,
  HAUL_PLUS,
  INCLUSION,
}

// Utility function to round up to the nearest multiple
const roundUp = (num: number | string, multiple: number | string): number => {
  return Math.ceil(Number(num) / Number(multiple)) * Number(multiple);
};

// Function to calculate Cost to Us (CTU)
const calculateCTU = (
  cost: number | string,
  fuel: number | string,
  tax: number | string
): number => {
  return Number(cost) * (1 + Number(fuel) / 100) * (1 + Number(tax) / 100);
};

// Function to calculate Price to Customer (PTC) for Delivery - NON-ASAP
const calculateDeliveryNonASAP = (
  dCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = calculateCTU(dCost, fuel, tax);
  const additionalCost = rca ? 20 : 25;
  const multiplier = rca ? 1.03 : 1.04;
  const ptc = (ctu + additionalCost) * multiplier;
  return { ptc: roundUp(ptc, 5), ctu };
};

// Function to calculate Price to Customer (PTC) for Delivery - ASAP
const calculateDeliveryASAP = (
  dCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = calculateCTU(dCost, fuel, tax);
  const additionalCost = 75;
  const multiplier = rca ? 1.03 : 1.04;
  const ptc = (ctu + additionalCost) * multiplier;
  return { ptc: roundUp(ptc, 5), ctu };
};

// Function to calculate Price to Customer (PTC) for Flat Rate
const calculateHaulFlat = (
  hCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = calculateCTU(hCost, fuel, tax);
  const additionalCost = rca ? 85 : 125;
  const multiplier = rca ? 1.03 : 1.04;
  const ptc = (ctu + additionalCost) * multiplier;
  return { ptc: roundUp(ptc, 5), ctu };
};

// Function to calculate Price to Customer (PTC) for Haul Plus Rate
const calculateHaulPlus = (
  hCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean,
  expT: number | string,
  minT: number | string,
  tonnageCost: number | string
): { ptc: number; ctu: number } => {
  const difT = expT > minT ? Number(expT) - Number(minT) : 0;
  const additionalCost = difT * Number(tonnageCost);
  const ctu = calculateCTU(Number(hCost) + additionalCost, fuel, tax);
  const baseCost = rca ? 85 : 125;
  const multiplier = rca ? 1.03 : 1.04;
  const ptc = (ctu + baseCost) * multiplier;
  return { ptc: roundUp(ptc, 5), ctu };
};

// Function to calculate Price to Customer (PTC) for Haul - Inclusion Rate
const calculateHaulInclusion = (
  hCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean,
  expT: number | string,
  incT: number | string,
  tonnageCost: number | string
): { ptc: number; ctu: number } => {
  let ctu;
  if (expT > incT) {
    const difT = Number(expT) - Number(incT);
    const additionalCost = difT * Number(tonnageCost);
    ctu = calculateCTU(Number(hCost) + Number(additionalCost), fuel, tax);
  } else {
    ctu = calculateCTU(hCost, fuel, tax);
  }
  const baseCost = rca ? 85 : 125;
  const multiplier = rca ? 1.03 : 1.04;
  const ptc = (ctu + baseCost) * multiplier;
  return { ptc: roundUp(ptc, 5), ctu };
};

// Function to calculate Price to Customer (PTC) for Rent
const calculateRent = (
  rCost: number | string,
  tax: number | string,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = Number(rCost) * (1 + Number(tax) / 100);
  const multiplier = rca ? 1.03 : 1.04;
  const ptc = ctu * multiplier;
  return { ptc: roundUp(ptc, 1), ctu };
};

const DumpsterCalculator = () => {
  const [dumpsterType, setDumpsterType] = useState(DumpsterType.FLAT_RATE);

  const [dCost, setDCost] = useState<number | string>("");
  const [hCost, setHCost] = useState<number | string>("");
  const [rCost, setRCost] = useState<number | string>("");
  const [fuel, setFuel] = useState<number | string>("");
  const [tax, setTax] = useState<number | string>("");
  const [rca, setRca] = useState<boolean>(false);
  const [isASAP, setIsASAP] = useState<boolean>(false);
  const [expT, setExpT] = useState<number | string>("");
  const [minT, setMinT] = useState<number | string>("");
  const [incT, setIncT] = useState<number | string>("");
  const [tonnageCost, setTonnageCost] = useState<number | string>("");

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<number | string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(parseFloat(e.target.value));
    };

  const handleCheckboxChange =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.checked);
    };

  const delivery = isASAP
    ? calculateDeliveryASAP(dCost, fuel, tax, rca)
    : calculateDeliveryNonASAP(dCost, fuel, tax, rca);

  let haul;
  if (dumpsterType === DumpsterType.FLAT_RATE) {
    haul = calculateHaulFlat(hCost, fuel, tax, rca);
  } else if (dumpsterType === DumpsterType.HAUL_PLUS) {
    haul = calculateHaulPlus(hCost, fuel, tax, rca, expT, minT, tonnageCost);
  } else if (dumpsterType === DumpsterType.INCLUSION) {
    haul = calculateHaulInclusion(
      hCost,
      fuel,
      tax,
      rca,
      expT,
      incT,
      tonnageCost
    );
  } else {
    haul = { ptc: 0, ctu: 0 };
  }

  const rent = calculateRent(rCost, tax, rca);

  return (
    <main className="flex flex-col items-start justify-start w-full max-w-[500px] sm:max-w-[600px] md:max-w-[650px] lg:max-w-[800px] md:mx-auto mt-4 md:mt-12">
      <div className="max-w-full sm:max-w-lg mx-auto">
        <TabGroup>
          <TabList className="flex flex-row items-center justify-around gap-2 sm:gap-4">
            <Tab
              className="rounded-full py-2 px-4 text-sm text-gray-700 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black"
              onClick={() => setDumpsterType(DumpsterType.FLAT_RATE)}
            >
              <h2>Flat Rate</h2>
            </Tab>
            <Tab
              className="rounded-full py-2 px-4 text-sm text-gray-700 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black"
              onClick={() => setDumpsterType(DumpsterType.HAUL_PLUS)}
            >
              <h2>Haul Plus Rate</h2>
            </Tab>
            <Tab
              className="rounded-full py-2 px-4 text-sm text-gray-700 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black"
              onClick={() => setDumpsterType(DumpsterType.INCLUSION)}
            >
              <h2>Inclusion Rate</h2>
            </Tab>
          </TabList>
          <div className="max-w-full sm:max-w-lg mx-auto mt-3 p-4 bg-white rounded-lg">
            <Fieldset className="space-y-4">
              <Field className="flex flex-col">
                <Label className="text-sm font-semibold text-gray-700">
                  Delivery Cost
                </Label>
                <Input
                  className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  type="number"
                  value={dCost}
                  onChange={handleInputChange(setDCost)}
                />
              </Field>
              <Field className="flex flex-col">
                <Label className="text-sm font-semibold text-gray-700">
                  Haul Cost
                </Label>
                <Input
                  className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  type="number"
                  value={hCost}
                  onChange={handleInputChange(setHCost)}
                />
              </Field>
              <Field className="flex flex-col">
                <Label className="text-sm font-semibold text-gray-700">
                  Rent Cost
                </Label>
                <Input
                  className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  type="number"
                  value={rCost}
                  onChange={handleInputChange(setRCost)}
                />
              </Field>
              <Field className="flex flex-col">
                <Label className="text-sm font-semibold text-gray-700">
                  Fuel (%)
                </Label>
                <Input
                  className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  type="number"
                  value={fuel}
                  onChange={handleInputChange(setFuel)}
                />
              </Field>
              <Field className="flex flex-col">
                <Label className="text-sm font-semibold text-gray-700">
                  Tax (%)
                </Label>
                <Input
                  className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  type="number"
                  value={tax}
                  onChange={handleInputChange(setTax)}
                />
              </Field>
              {dumpsterType !== DumpsterType.FLAT_RATE && (
                <>
                  <Field className="flex flex-col">
                    <Label className="text-sm font-semibold text-gray-700">
                      Expected Tonnage
                    </Label>
                    <Input
                      className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      type="number"
                      value={expT}
                      onChange={handleInputChange(setExpT)}
                    />
                  </Field>
                  {dumpsterType === DumpsterType.INCLUSION && (
                    <Field className="flex flex-col">
                      <Label className="text-sm font-semibold text-gray-700">
                        Included Tonnage
                      </Label>
                      <Input
                        className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        type="number"
                        value={incT}
                        onChange={handleInputChange(setIncT)}
                      />
                    </Field>
                  )}
                  <Field className="flex flex-col">
                    <Label className="text-sm font-semibold text-gray-700">
                      Minimum Tonnage
                    </Label>
                    <Input
                      className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      type="number"
                      value={minT}
                      onChange={handleInputChange(setMinT)}
                    />
                  </Field>
                  <Field className="flex flex-col">
                    <Label className="text-sm font-semibold text-gray-700">
                      Tonnage Cost
                    </Label>
                    <Input
                      className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      type="number"
                      value={tonnageCost}
                      onChange={handleInputChange(setTonnageCost)}
                    />
                  </Field>
                </>
              )}
              <Field className="flex items-center">
                <Label
                  className="text-sm font-semibold text-gray-700 py-2 pr-4"
                  htmlFor="rca"
                >
                  RCA
                </Label>
                <Input
                  id="rca"
                  name="rca"
                  className="ml-3"
                  type="checkbox"
                  checked={rca}
                  onChange={handleCheckboxChange(setRca)}
                />
              </Field>
              <Field className="flex items-center">
                <Label
                  className="text-sm font-semibold text-gray-700 py-2 pr-4"
                  htmlFor="asap"
                >
                  ASAP
                </Label>
                <Input
                  id="asap"
                  name="asap"
                  className="ml-3"
                  type="checkbox"
                  checked={isASAP}
                  onChange={handleCheckboxChange(setIsASAP)}
                />
              </Field>
            </Fieldset>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      🚛
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Our Cost
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Delivery
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${delivery.ctu.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ${delivery.ptc.toFixed(0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Haul
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${haul.ctu.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ${haul.ptc.toFixed(0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rent
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${rent.ctu.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ${rent.ptc.toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabGroup>
      </div>
      <footer className="text-xs text-neutral-400 self-end">
        support: jordanwfrankfurt@gmail.com
      </footer>
    </main>
  );
};

export default DumpsterCalculator;
