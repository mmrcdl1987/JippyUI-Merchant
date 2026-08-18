import "../../styles/CreatePlan.css";
import { useState } from "react";
import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

const CreatePlan = () => {

  const [planType, setPlanType] = useState("% Off Plan");

  const [appliesOn, setAppliesOn] = useState("All Items");

  return (

    <div className="merchant-create-plan-container">

      <h2 className="merchant-create-plan-title">
        Create Plan
      </h2>

      <p className="merchant-create-plan-description">
        Create a custom promotional plan.
      </p>

      <div className="merchant-create-plan-form">

        {/* Plan Name */}

        <div className="merchant-create-plan-group">

          <label>Plan Name</label>

          <input
            type="text"
            placeholder="Weekend Special"
            className="merchant-create-plan-input"
          />

        </div>

        {/* Plan Type */}

       {/* Plan Type */}

<div className="merchant-create-plan-group">

  <label>Plan Type</label>

  <RadioGroup
    row
    value={planType}
    onChange={(e) => setPlanType(e.target.value)}
    className="merchant-create-plan-type-radio"
  >

    <FormControlLabel
      value="% Off Plan"
      control={<Radio />}
      label="% Off Plan"
    />

    <FormControlLabel
      value="Flat Offer"
      control={<Radio />}
      label="Flat Offer"
    />

    <FormControlLabel
      value="1+1 Offer"
      control={<Radio />}
      label="1+1 Offer"
    />

  </RadioGroup>

</div>

        {/* Discount Value */}

        <div className="merchant-create-plan-group">

          <label>Discount Value</label>

          <input
            type="number"
            placeholder="15"
            className="merchant-create-plan-input"
          />

        </div>

        {/* Dates */}

        <div className="merchant-create-plan-two-column">

          <div className="merchant-create-plan-group">

            <label>Start Date</label>

            <input
              type="date"
              className="merchant-create-plan-input"
            />

          </div>

          <div className="merchant-create-plan-group">

            <label>End Date</label>

            <input
              type="date"
              className="merchant-create-plan-input"
            />

          </div>

        </div>

        {/* Applies On */}

        <div className="merchant-create-plan-group">

          <label>Applies On</label>

          <RadioGroup
            row
            value={appliesOn}
            onChange={(e) => setAppliesOn(e.target.value)}
            className="merchant-create-plan-radio"
          >

            <FormControlLabel
              value="All Items"
              control={<Radio />}
              label="All Items"
            />

            <FormControlLabel
              value="Selected Categories"
              control={<Radio />}
              label="Selected Categories"
            />

            <FormControlLabel
              value="Selected Items"
              control={<Radio />}
              label="Selected Items"
            />

          </RadioGroup>
                    <Button
            variant="contained"
            className="merchant-create-plan-submit"
          >
            Submit Plan
          </Button>

        </div>

      </div>

    </div>

  );
};

export default CreatePlan;