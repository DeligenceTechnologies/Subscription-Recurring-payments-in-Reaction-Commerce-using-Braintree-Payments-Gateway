/* eslint no-unused-vars: 0 */
import { AutoForm } from "meteor/aldeed:autoform";
import { Template } from "meteor/templating";
import { Reaction, i18next } from "/client/api";
import { Packages } from "/lib/collections";
import { BraintreeSubscriptionPackageConfig } from "../../lib/collections/schemas";

import "./braintreeSubscription.html";

Template.braintreeSubscriptionSettings.helpers({
  BraintreeSubscriptionPackageConfig() {
    return BraintreeSubscriptionPackageConfig;
  },

  packageData() {
    return Packages.findOne({
      name: "reaction-braintree-subscription"
    });
  }
});

Template.braintreeSubscription.helpers({
  packageData() {
    const packageData = Packages.findOne({
      name: "reaction-braintree-subscription"
    });
    return packageData;
  }
});

Template.braintreeSubscription.events({
  "click [data-event-action=showBraintreeSubscriptionSettings]"() {
    Reaction.showActionView();
  }
});

AutoForm.hooks({
  "braintree-update-subscription-form": {
    onSuccess() {
      return Alerts.toast(i18next.t("admin.settings.saveSuccess"), "success");
    },
    onError(error) {
      return Alerts.toast(`${i18next.t("admin.settings.saveFailed")} ${error}`, "error");
    }
  }
});
