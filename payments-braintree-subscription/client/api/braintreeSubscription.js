import { Meteor } from "meteor/meteor";

export const BraintreeSubscription =
  {
  // Do authorization for oneTime payment and make payment for subscription based payment to Braintree
    doPayment(cardData, paymentData, paymentType, callback) {
      Meteor.call("braintree-subscriptionSubmit", "authorize", cardData, paymentData, paymentType, callback);
    }
  };
