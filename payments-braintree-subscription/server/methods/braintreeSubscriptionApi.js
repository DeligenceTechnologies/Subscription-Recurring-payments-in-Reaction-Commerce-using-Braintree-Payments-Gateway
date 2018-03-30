/* eslint camelcase: 0 */
import Braintree from "braintree";
import accounting from "accounting-js";
import Future from "fibers/future";
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Packages } from "/lib/collections";
import { Reaction, Logger } from "/server/api";

let moment;
async function lazyLoadMomentSubs() {
  if (moment) return;
  moment = await import("moment");
}


export const BraintreeSubsApi = {};
BraintreeSubsApi.apiCall = {};


function getPaymentObjSubs() {
  return {
    amount: "",
    options: { submitForSettlement: true }
  };
}

function parseCardDataSubs(data) {
  return {
    cardholderName: data.name,
    number: data.number,
    expirationMonth: data.expirationMonth,
    expirationYear: data.expirationYear,
    cvv: data.cvv
  };
}


function getSettingsSubs(settings, ref, valueName) {
  if (settings !== null) {
    return settings[valueName];
  } else if (ref !== null) {
    return ref[valueName];
  }
  return undefined;
}

function getAccountOptionsSubs(isPayment) {
  const queryConditions = {
    name: "reaction-braintree-subscription",
    shopId: Reaction.getShopId()
  };
  if (isPayment) {
    queryConditions.enabled = true;
  }

  const { settings } = Packages.findOne(queryConditions);
  let environment;
  if (typeof settings !== "undefined" && settings !== null ? settings.mode : undefined === true) {
    environment = "production";
  } else {
    environment = "sandbox";
  }

  const ref = Meteor.settings.braintree;
  const options = {
    environment,
    merchantId: getSettingsSubs(settings, ref, "merchant_id"),
    publicKey: getSettingsSubs(settings, ref, "public_key"),
    privateKey: getSettingsSubs(settings, ref, "private_key")
  };
  if (!options.merchantId) {
    throw new Meteor.Error("invalid-credentials", "Invalid Braintree Credentials");
  }
  return options;
}

function getGatewaySubs(isNewPayment) {
  const accountOptions = getAccountOptionsSubs(isNewPayment);
  if (accountOptions.environment === "production") {
    accountOptions.environment = Braintree.Environment.Production;
  } else {
    accountOptions.environment = Braintree.Environment.Sandbox;
  }
  const gateway = Braintree.connect(accountOptions);
  return gateway;
}

function getRefundDetailsSubs(refundId) {
  check(refundId, String);
  const gateway = getGatewaySubs();
  const braintreeFind = Meteor.wrapAsync(gateway.transaction.find, gateway.transaction);
  const findResults = braintreeFind(refundId);
  return findResults;
}

// Create subscription based payment in brainTree

function createSubscrioptionInBrainTree(paymentSubmitDetails){

  const isNewPayment = true;
  //console.log(paymentSubmitDetails);
  const gateway = getGatewaySubs(isNewPayment);
  const paymentObj = getPaymentObjSubs();
  paymentObj.creditCard = parseCardDataSubs(paymentSubmitDetails.cardData);
  paymentObj.amount = paymentSubmitDetails.paymentData.total;

  const fut = new Future();

  gateway.plan.all(Meteor.bindEnvironment(function(err, result) {
    //console.log(result.plans[0].id);
    if(result.plans && result.plans.length && result.plans[0].id){
      let plan=result.plans[0].id;
      gateway.customer.create({

        firstName: paymentSubmitDetails.cardData.name,
        paymentMethodNonce: "fake-valid-nonce",
        creditCard: paymentObj.creditCard

      },function (err, result) {
        //console.log(result.customer.id);
        //console.log(result.customer.paymentMethods[0].token);
        if(result.customer.paymentMethods[0].token){

          gateway.subscription.create({
            paymentMethodToken: result.customer.paymentMethods[0].token,
            planId: plan,
            //trialDuration: 0,
            price : paymentObj.amount,
          },(error, result) => {
            if(result.success){
              Logger.info("Subscription is created successfully");
            }
            if (error) {
              fut.return({
                saved: false,
                paymentType : paymentSubmitDetails.paymentType,
                error
              });
            } else if (!result.success) {
              fut.return({
                saved: false,
                paymentType : paymentSubmitDetails.paymentType,
                response: result
              });
            } else {
              //console.log(result);
              fut.return({
                saved: true,
                paymentType : paymentSubmitDetails.paymentType,
                response: result
              });
            }

          });
        }
      });
    }
  },(error) => {
    Logger.error("error-processing-subscription-payment", error);
  }));
  return fut.wait();
}

// Create one time payment in brainTree

function createOneTimePaymentInBrainTree(paymentSubmitDetails){
  const isNewPayment = true;
  const gateway = getGatewaySubs(isNewPayment);
  const paymentObj = getPaymentObjSubs();
  if (paymentSubmitDetails.transactionType === "authorize") {
    paymentObj.options.submitForSettlement = false;
  }
  paymentObj.creditCard = parseCardDataSubs(paymentSubmitDetails.cardData);
  paymentObj.amount = paymentSubmitDetails.paymentData.total;
  const fut = new Future();
  gateway.transaction.sale(paymentObj, Meteor.bindEnvironment((error, result) => {
    if (error) {
      fut.return({
        saved: false,
        paymentType : paymentSubmitDetails.paymentType,
        error
      });
    } else if (!result.success) {
      fut.return({
        saved: false,
        paymentType : paymentSubmitDetails.paymentType,
        response: result
      });
    } else {
      fut.return({
        saved: true,
        paymentType : paymentSubmitDetails.paymentType,
        response: result
      });
    }
  }, (error) => {
    Reaction.Events.warn(error);
  }));
  return fut.wait();

}

BraintreeSubsApi.apiCall.paymentSubmit = function (paymentSubmitDetails) {
  const oneTime = "oneTime";
  const subscription = "subscription";

  if(paymentSubmitDetails.paymentType === oneTime){

    // For one time payment

    return createOneTimePaymentInBrainTree(paymentSubmitDetails);

  } else if(paymentSubmitDetails.paymentType === subscription){

    //For Subscription

    return createSubscrioptionInBrainTree(paymentSubmitDetails);

  }
};


BraintreeSubsApi.apiCall.captureCharge = function (paymentCaptureDetails) {
  const { transactionId } = paymentCaptureDetails;
  const amount = accounting.toFixed(paymentCaptureDetails.amount, 2);
  const gateway = getGatewaySubs();
  const fut = new Future();

  if (amount === accounting.toFixed(0, 2)) {
    gateway.transaction.void(transactionId, (error, result) => {
      if (error) {
        fut.return({
          saved: false,
          error
        });
      } else {
        fut.return({
          saved: true,
          response: result
        });
      }
    }, (e) => {
      Logger.warn(e);
    });
    return fut.wait();
  }
  gateway.transaction.submitForSettlement(transactionId, amount, Meteor.bindEnvironment((error, result) => {
    if (error) {
      fut.return({
        saved: false,
        error
      });
    } else {
      fut.return({
        saved: true,
        response: result
      });
    }
  }, (e) => {
    Logger.warn(e);
  }));

  return fut.wait();
};


BraintreeSubsApi.apiCall.createRefund = function (refundDetails) {
  const { amount, transactionId } = refundDetails;
  const gateway = getGatewaySubs();
  const fut = new Future();
  gateway.transaction.refund(transactionId, amount, Meteor.bindEnvironment((error, result) => {
    if (error) {
      fut.return({
        saved: false,
        error
      });
    } else if (!result.success) {
      if (result.errors.errorCollections.transaction.validationErrors.base[0].code === "91506") {
        fut.return({
          saved: false,
          error: "Braintree does not allow refunds until transactions are settled. This can take up to 24 hours. Please try again later."
        });
      } else {
        fut.return({
          saved: false,
          error: result.message
        });
      }
    } else {
      fut.return({
        saved: true,
        response: result
      });
    }
  }, (e) => {
    Logger.fatal(e);
  }));
  return fut.wait();
};


BraintreeSubsApi.apiCall.listRefunds = function (refundListDetails) {
  const { transactionId } = refundListDetails;
  const gateway = getGatewaySubs();
  const braintreeFind = Meteor.wrapAsync(gateway.transaction.find, gateway.transaction);
  const findResults = braintreeFind(transactionId);
  const result = [];
  if (findResults.refundIds.length > 0) {
    Promise.await(lazyLoadMomentSubs());
    for (const refund of findResults.refundIds) {
      const refundDetails = getRefundDetailsSubs(refund);
      result.push({
        type: "refund",
        amount: parseFloat(refundDetails.amount),
        created: moment(refundDetails.createdAt).unix() * 1000,
        currency: refundDetails.currencyIsoCode,
        raw: refundDetails
      });
    }
  }

  return result;
};
