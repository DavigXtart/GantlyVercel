package com.alvaro.psicoapp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {
    private Prices prices = new Prices();

    public Prices getPrices() { return prices; }
    public void setPrices(Prices prices) { this.prices = prices; }

    public static class Prices {
        private PlanPrices basic = new PlanPrices();
        private PlanPrices premium = new PlanPrices();
        private PlanPrices enterprise = new PlanPrices();

        public PlanPrices getBasic() { return basic; }
        public void setBasic(PlanPrices basic) { this.basic = basic; }
        public PlanPrices getPremium() { return premium; }
        public void setPremium(PlanPrices premium) { this.premium = premium; }
        public PlanPrices getEnterprise() { return enterprise; }
        public void setEnterprise(PlanPrices enterprise) { this.enterprise = enterprise; }
    }

    public static class PlanPrices {
        private String monthly = "";
        private String yearly = "";

        public String getMonthly() { return monthly; }
        public void setMonthly(String monthly) { this.monthly = monthly; }
        public String getYearly() { return yearly; }
        public void setYearly(String yearly) { this.yearly = yearly; }
    }
}
