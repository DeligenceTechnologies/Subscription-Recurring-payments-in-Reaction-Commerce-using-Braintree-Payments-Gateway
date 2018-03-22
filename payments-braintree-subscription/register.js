/* eslint camelcase: 0 */
import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "BrainTree Subscription",
  icon: "fa fa-credit-card",
  autoEnable: true,
  name: "reaction-braintree-subscription", // usually same as meteor package
  settings: // private package settings config (blackbox)
  {
    "mode": false,
    "merchant_id": "",
    "public_key": "",
    "private_key": "",
    "reaction-braintree-subscription": {
      enabled: false,
      support: [
        "Authorize",
        "Capture",
        "Refund"
      ]
    }
  },
  registry: [
    {
      label: "Braintree Subscription",
      provides: ["paymentSettings"],
      container: "dashboard",
      template: "braintreeSubscriptionSettings"
    },
    // configures template for checkout
    // paymentMethod dynamic template
    {
      template: "braintreeSubscriptionPaymentForm",
      provides: ["paymentMethod"],
      icon: "fa fa-credit-card"
    }
  ]
});
