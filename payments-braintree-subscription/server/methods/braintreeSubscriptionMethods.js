import { check } from "meteor/check";
import { BraintreeSubsApi } from "./braintreeSubscriptionApi";
import { Logger } from "/server/api";
import { PaymentMethod } from "/lib/collections/schemas";

/**
 * braintreeSubmit
 * Authorize, or authorize and capture payments from Braintree
 * https://developers.braintreepayments.com/reference/request/transaction/sale/node
 * @param {String} transactionType - either authorize or capture
 * @param {Object} cardData - Object containing everything about the Credit card to be submitted
 * @param {Object} paymentData - Object containing everything about the transaction to be settled
 * @return {Object} results - Object containing the results of the transaction
 */
export function paymentSubSubmit(transactionType, cardData, paymentData, paymentType) {
  check(transactionType, String);
  check(cardData, {
    name: String,
    number: String,
    expirationMonth: String,
    expirationYear: String,
    cvv2: String,
    type: String
  });
  check(paymentData, {
    total: String,
    currency: String
  });

  check(paymentType, String);
  
  const paymentSubmitDetails = {
    transactionType,
    cardData,
    paymentData,
    paymentType
  };

  let result;

  try {
    const paymentSubmitResult = BraintreeSubsApi.apiCall.paymentSubmit(paymentSubmitDetails);
    Logger.debug(paymentSubmitResult);
    result = paymentSubmitResult;
  } catch (error) {
    Logger.error(error);
    result = {
      saved: false,
      error: `Cannot Submit Payment: ${error.message}`
    };
    Logger.fatal("Braintree call failed, payment was not submitted");
  }

  return result;
}


/**
 * paymentCapture
 * Capture payments from Braintree
 * https://developers.braintreepayments.com/reference/request/transaction/submit-for-settlement/node
 * @param {Object} paymentMethod - Object containing everything about the transaction to be settled
 * @return {Object} results - Object containing the results of the transaction
 */
export function paymentSubCapture(paymentMethod) {
  check(paymentMethod, PaymentMethod);

  const paymentCaptureDetails = {
    transactionId: paymentMethod.transactionId,
    amount: paymentMethod.amount
  };

  let result;

  try {
    const paymentCaptureResult = BraintreeSubsApi.apiCall.captureCharge(paymentCaptureDetails);
    Logger.debug(paymentCaptureResult);
    result = paymentCaptureResult;
  } catch (error) {
    Logger.error(error);
    result = {
      saved: false,
      error: `Cannot Capture Payment: ${error.message}`
    };
    Logger.fatal("Braintree call failed, payment was not captured");
  }

  return result;
}


/**
 * createRefund
 * Refund BrainTree payment
 * https://developers.braintreepayments.com/reference/request/transaction/refund/node
 * @param {Object} paymentMethod - Object containing everything about the transaction to be settled
 * @param {Number} amount - Amount to be refunded if not the entire amount
 * @return {Object} results - Object containing the results of the transaction
 */
export function createSubRefund(paymentMethod, amount) {
  check(paymentMethod, PaymentMethod);
  check(amount, Number);

  const refundDetails = {
    transactionId: paymentMethod.transactionId,
    amount
  };

  let result;

  try {
    const refundResult = BraintreeSubsApi.apiCall.createRefund(refundDetails);
    Logger.debug(refundResult);
    result = refundResult;
  } catch (error) {
    Logger.error(error);
    result = {
      saved: false,
      error: `Cannot issue refund: ${error.message}`
    };
    Logger.fatal("Braintree call failed, refund was not issued");
  }

  return result;
}


/**
 * listRefunds
 * List all refunds for a transaction
 * https://developers.braintreepayments.com/reference/request/transaction/find/node
 * @param {Object} paymentMethod - Object containing everything about the transaction to be settled
 * @return {Array} results - An array of refund objects for display in admin
 */
export function listSubRefunds(paymentMethod) {
  //console.log("refund");
  //console.log(paymentMethod);
  
  check(paymentMethod, Object);
  let result;
  if(paymentMethod.storedCard === 'Subscription'){
    result=[];
    return result;
  }
  const refundListDetails = {
    transactionId: paymentMethod.transactionId
  };
  try {
      const refundListResult = BraintreeSubsApi.apiCall.listRefunds(refundListDetails);
      Logger.debug(refundListResult);
      result = refundListResult;
    } catch (error) {
      Logger.error(error);
      result = {
        saved: false,
        error: `Cannot list refunds: ${error.message}`
      };
      Logger.fatal("Braintree call failed, refunds not listed");
    }
   return result;

  
}
