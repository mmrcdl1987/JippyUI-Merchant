import { useState } from "react";
import "../../styles/CreatePlan.css";

const CreatePlan = ({ outletId }) => {

  const [planType, setPlanType] =
    useState("% Off Plan");

  return (
    <div className="merchant-create-plan-container">

      <h2 className="merchant-create-plan-title">
        Create Plan
      </h2>

      <p className="merchant-create-plan-description">
        Choose a promotion type to create a plan for this outlet.
      </p>

      <div className="merchant-create-plan-form">

        <div className="merchant-create-plan-group">

          <label>Selected Outlet</label>

          <input
            value={outletId}
            readOnly
            className="merchant-create-plan-input"
          />

        </div>

        <div className="merchant-create-plan-group">

          <label>Plan Type</label>

          <div className="merchant-create-plan-type-radio">

            {[
              "% Off Plan",
              "Flat Offer",
              "1+1 Offer",
              "Slot Booking",
              "Festival Offer",
            ].map((type) => (

              <label key={type}>

                <input
                  type="radio"
                  value={type}
                  checked={planType === type}
                  onChange={(e) =>
                    setPlanType(e.target.value)
                  }
                />

                {type}

              </label>

            ))}

          </div>

        </div>

        <div className="merchant-create-plan-group">

          <p>
            Select the corresponding promotion card above
            to configure all promotion-specific fields.
          </p>

        </div>

      </div>

    </div>
  );
};

export default CreatePlan;