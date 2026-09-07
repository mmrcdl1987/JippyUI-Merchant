import { useEffect, useState } from "react";
import Select from "react-select";


import API from "../../services/api";

import "../../styles/Subscription.css";





function AdvertisementOutlets() {
  const [pricingType, setPricingType] = useState("FLAT");

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
const merchantId = userData.merchantId;

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [plans, setPlans] = useState([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
  if (!selectedPlan || !startDate) {
    setEndDate("");
    return;
  }

  const start = new Date(startDate);

  start.setDate(
    start.getDate() + Number(selectedPlan.durationInDays) - 1
  );

  const calculatedEndDate = start.toISOString().split("T")[0];

  setEndDate(calculatedEndDate);
}, [selectedPlan, startDate]);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await API.get("/api/fm/location/fetchStates");
      setStates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;

    setSelectedState(stateId);
    setSelectedCity("");
    setSelectedArea("");
    setSelectedOutlet("");
    setSelectedPlan(null);

    setCities([]);
    setAreas([]);
    setOutlets([]);
    setPlans([]);

    try {
      const response = await API.get(
        `/api/fm/location/fetchCityInState?stateId=${stateId}`
      );
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;

    setSelectedCity(cityId);
    setSelectedArea("");
    setSelectedOutlet("");
    setSelectedPlan(null);

    setAreas([]);
    setOutlets([]);
    setPlans([]);

    try {
      const response = await API.get(
        `/api/fm/location/fetchAreaInCity?cityId=${cityId}`
      );
      setAreas(response.data);
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  const handleAreaChange = async (e) => {
    const areaId = e.target.value;

    setSelectedArea(areaId);
    setSelectedOutlet("");
    setSelectedPlan(null);
    setPlans([]);
    setOutlets([]);

    if (!areaId) return;

    fetchSubscriptionPlans(areaId);
  };

const fetchOutlets = async () => {
  try {
    const merchantId = localStorage.getItem("merchantId");

    console.log("Logged-in Merchant ID:", merchantId);

    if (!merchantId) {
      console.error("Merchant ID not found in localStorage");
      setOutlets([]);
      return;
    }

    const response = await API.get(
      "/api/fm/outlets/getOutletsByMerchant",
      {
        params: {
          merchantId: merchantId,
        },
      }
    );

    console.log("FULL OUTLET API RESPONSE:", response);
    console.log("OUTLET API DATA:", response.data);

    const outletData =
      response.data?.data ??
      response.data?.outlets ??
      response.data;

    console.log("FINAL OUTLET DATA:", outletData);

    setOutlets(Array.isArray(outletData) ? outletData : []);

  } catch (error) {
    console.error("FETCH OUTLETS ERROR:", error);
    console.error("ERROR RESPONSE:", error.response?.data);
    setOutlets([]);
  }
};
  const fetchSubscriptionPlans = async (areaId) => {
    try {

         console.log("AREA ID:", areaId);


   const response = await API.get(
  `/api/fm/subscription-plans/area/${areaId}`
);
      console.log("SUBSCRIPTION PLANS RESPONSE:", response.data);


      setPlans(
        Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      setPlans([]);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        outletId: Number(selectedOutlet),
        subscriptionPlanId: selectedPlan.subscriptionPlanId,
        subscriptionFromDate: startDate,
        subscriptionToDate: endDate,
        bannerSlotDaysId: selectedPlan.bannerDurationInDays,
        bannerFromDate: startDate,
        bannerToDate: endDate,
        mealTypeTimingsIds: [],
        priceModelType: "FLAT",
        offerAmount: 0,
        userId: JSON.parse(localStorage.getItem("userData") || "{}").userId,
      };

      const response = await API.post(
        "/api/fm/outlet-subscription-plans",
        payload
      );

      alert(response.data.message || "Successfully saved!");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message || "Unable to save subscription plan."
      );
    }
  };

  const outletOptions = outlets.map((outlet) => ({
    value: outlet.outletId,
    label: outlet.outletName,
  }));


  const stateOptions = states.map((state) => ({
  value: state.stateId,
  label: state.stateName,
}));

const cityOptions = cities.map((city) => ({
  value: city.cityId,
  label: city.cityName,
}));

const areaOptions = areas.map((area) => ({
  value: area.areaId,
  label: area.areaName,
}));

  return (
    <div className="advertisement-page">
      <div className="page-header">
        <div>
          <h2>Subscription Plans</h2>
          <p>Manage subscription plans for outlets</p>
        </div>
      </div>

      <div className="advertisement-card">
        <h3>Subscription Outlet Registration</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>
              State <span className="required-star">*</span>
            </label>
           <Select
  options={stateOptions}
  placeholder="Select State"
  value={
    stateOptions.find(
      (option) => option.value === Number(selectedState)
    ) || null
  }
  onChange={(option) =>
    handleStateChange({
      target: { value: option?.value || "" }
    })
  }
  isSearchable
  isClearable
/>
          </div>

          <div className="form-group">
            <label>
              City <span className="required-star">*</span>
            </label>
           <Select
  options={cityOptions}
  placeholder="Select City"
  value={
    cityOptions.find(
      (option) => option.value === Number(selectedCity)
    ) || null
  }
  onChange={(option) =>
    handleCityChange({
      target: { value: option?.value || "" }
    })
  }
  isSearchable
  isClearable
/>
          </div>

          <div className="form-group">
            <label>
              Area <span className="required-star">*</span>
            </label>
            <Select
  options={areaOptions}
  placeholder="Select Area"
  value={
    areaOptions.find(
      (option) => option.value === Number(selectedArea)
    ) || null
  }
  onChange={(option) =>
    handleAreaChange({
      target: { value: option?.value || "" }
    })
  }
  isSearchable
  isClearable
/>
          </div>

          <div className="form-group">
            <label>
              Outlet <span className="required-star">*</span>
            </label>
            <Select
              options={outletOptions}
              placeholder="Select Outlet"
              value={
                outletOptions.find(
                  (option) => option.value === selectedOutlet
                ) || null
              }
              onMenuOpen={fetchOutlets}
              onChange={(selectedOption) =>
                setSelectedOutlet(selectedOption?.value || "")
              }
              isSearchable
            />
          </div>
        </div>
      </div>

      {selectedArea && plans.length > 0 && (


        <div className="advertisement-card">
          <h3>Available Subscription Plans</h3>

          <div className="plans-table-wrapper">
            <table className="plans-table">

<colgroup>
  <col style={{ width: "60px" }} />
  <col style={{ width: "120px" }} />
  <col style={{ width: "80px" }} />
  <col style={{ width: "110px" }} />
  <col style={{ width: "90px" }} />
  <col style={{ width: "145px" }} />
  <col style={{ width: "100px" }} />
  <col style={{ width: "135px" }} />
  <col style={{ width: "90px" }} />
  <col style={{ width: "130px" }} />
  <col style={{ width: "110px" }} />
</colgroup>

              <thead>
                <tr>
                  <th>Select</th>
                  <th>Plan Name</th>
                  <th>Price</th>
                  <th>Duration (Days)</th>
                  <th>Radius (KM)</th>
                  <th>Banner Duration Days</th>
                  <th>Banner Slots</th>
                  <th>Best Restaurant Slot</th>
                  <th>Deals Slot</th>
                  <th>WhatsApp Broadcast</th>
                  <th>Video Credits</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.subscriptionPlanId}
                    className={
                      selectedPlan?.subscriptionPlanId === plan.subscriptionPlanId
                        ? "selected-plan-row"
                        : ""
                    }
                  >
                    <td>
                      <input
                        type="radio"
                        name="selectedPlan"
                        checked={
                          selectedPlan?.subscriptionPlanId ===
                          plan.subscriptionPlanId
                        }
                        onChange={() => setSelectedPlan(plan)}
                      />
                    </td>
                    <td>{plan.planName}</td>
                    <td className="plan-price">{plan.price}</td>
                    <td>{plan.durationInDays}</td>
                    <td>{plan.radiusInKms}</td>
                    <td>{plan.bannerDurationInDays}</td>
                    <td>{plan.bannerSlot}</td>
                    <td>{plan.bestRestaurantSlot}</td>
                    <td>{plan.dealsSlot}</td>
                    <td>{plan.whatsappBroadcast}</td>
                    <td>{plan.videoCredits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPlan && (
        <>
          <div className="advertisement-bottom-grid">
            <div className="advertisement-card">
              <h3>Subscription Dates</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Start Date <span className="required-star">*</span>
                  </label>
                  <div className="date-input-wrapper">
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
  />
  <span
    className="calendar-icon"
    onClick={(e) => {
      e.currentTarget.previousElementSibling?.showPicker?.();
    }}
  >
    📅
  </span>
</div>
                </div>

                <div className="form-group">
                  <label>
                    End Date <span className="required-star">*</span>
                  </label>
                 <div className="date-input-wrapper">
 <input
  type="date"
  value={endDate}
  readOnly
/>
  <span
    className="calendar-icon"
    onClick={(e) => {
      e.currentTarget.previousElementSibling?.showPicker?.();
    }}
  >
    📅
  </span>
</div>
                </div>
              </div>
            </div>
          </div>

          <div className="advertisement-buttons">
            <button className="cancel-btn">Cancel</button>
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdvertisementOutlets;