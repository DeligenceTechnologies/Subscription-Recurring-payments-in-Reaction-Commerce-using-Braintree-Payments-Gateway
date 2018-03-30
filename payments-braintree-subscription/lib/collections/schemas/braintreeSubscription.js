import SimpleSchema from "simpl-schema";
import { check } from "meteor/check";
import { Tracker } from "meteor/tracker";
import { PackageConfig } from "/lib/collections/schemas/registry";
import { registerSchema } from "@reactioncommerce/reaction-collections";


/**
 *  Meteor.settings.braintree =
 *    mode: false  #sandbox
 *    merchant_id: ""
 *    public_key: ""
 *    private_key: ""
 *  see: https://developers.braintreepayments.com/javascript+node/reference
 */
export const BraintreeSubscriptionPackageConfig = PackageConfig.clone().extend({
    "settings.mode": {
      type: Boolean,
      defaultValue: false
    },
    "settings.merchant_id": {
      type: String,
      label: "Merchant ID",
      optional: false
    },
    "settings.public_key": {
      type: String,
      label: "Public Key",
      optional: false
    },
    "settings.private_key": {
      type: String,
      label: "Private Key",
      optional: false
    },
    "settings.reaction-braintree.support": {
      type: Array,
      label: "Payment provider supported methods"
    },
    "settings.reaction-braintree.support.$": {
      type: String,
      allowedValues: ["Authorize", "De-authorize", "Capture", "Refund"]
    }
  }
);

registerSchema("BraintreeSubscriptionPackageConfig", BraintreeSubscriptionPackageConfig);

export const BraintreeSubscriptionPayment = new SimpleSchema({
  payerName: {
    type: String,
    label: "Cardholder name"
  },
  cardNumber: {
    type: String,
    min: 12,
    max: 19,
    label: "Card number"
  },
  expireMonth: {
    type: String,
    max: 2,
    label: "Expiration month"
  },
  expireYear: {
    type: String,
    max: 4,
    label: "Expiration year"
  },
  cvv: {
    type: String,
    max: 4,
    label: "CVV"
  }
}, { check, tracker: Tracker });

registerSchema("BraintreeSubscriptionPayment", BraintreeSubscriptionPayment);
