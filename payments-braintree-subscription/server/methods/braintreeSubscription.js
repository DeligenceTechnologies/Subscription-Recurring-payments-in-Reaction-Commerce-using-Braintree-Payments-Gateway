import { Meteor } from "meteor/meteor";
import * as BraintreeSubscriptionMethods from "./braintreeSubscriptionMethods";

//Create method for payment , refund for payment in BrainTree.

Meteor.methods({
  "braintree-subscriptionSubmit": BraintreeSubscriptionMethods.paymentSubSubmit,
  "braintree-subscription/payment/capture": BraintreeSubscriptionMethods.paymentSubCapture,
  "braintree-subscription/refund/create": BraintreeSubscriptionMethods.createSubRefund,
  "braintree-subscription/refund/list": BraintreeSubscriptionMethods.listSubRefunds
});
