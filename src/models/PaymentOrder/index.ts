import { PaymentType, Status } from "@prisma/client";
import { builder } from "../../builder";
import "./mutation";

builder.enumType(PaymentType, {
  name: "PaymentType",
});

builder.enumType(Status, {
  name: "Status",
});

builder.prismaObject("PaymentOrder", {
  fields: (t) => ({
    id: t.exposeID("id"),
    amount: t.exposeInt("amount"),
    status: t.expose("status", {
      type: Status,
    }),
    orderId: t.exposeID("orderId"),
    user: t.relation("User"),
  }),
});

builder.prismaObject("EventPaymentOrder", {
  fields: (t) => ({
    id: t.exposeID("id"),
    amount: t.exposeInt("amount"),
    status: t.expose("status", {
      type: Status,
    }),
    orderId: t.exposeID("orderId"),
    Team: t.relation("Team"),
  }),
});
