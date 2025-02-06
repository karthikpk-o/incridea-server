import { AVATARS } from "~/constants/avatars";
import { type Avatar } from "~/constants/type";

const CONSTANT = {
  REG_AMOUNT_IN_INR: {
    INTERNAL: 350,
    EXTERNAL: 450,
    OTHER: 1000000000,
  },
  PEOPLE_WHO_DONT_DESERVE_TO_BE_IN_PRONITE: [466] as number[],
  ID_OF_PRONITE_SCANNING_USER: 5181,
  PRONITE: {
    DAY_1: new Date("28 February 2025 00:00 GMT+0530"),
    DAY_2: new Date("01 March 2025 00:00 GMT+0530"),
  },
  AVATARS: AVATARS as Avatar[],
};

export { CONSTANT };
