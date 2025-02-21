import { CONSTANT } from "~/constants";

const checkIfAccommodationMember = (id: number) => {
  return CONSTANT.PID.ACCOMMODATION.find((memberId) => memberId === id);
};

const checkIfPublicityMember = (id: number) => {
  return CONSTANT.PID.PUBLICITY.find((memberId) => memberId === id);
};

export { checkIfAccommodationMember, checkIfPublicityMember };
