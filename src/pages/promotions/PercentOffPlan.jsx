import "../../styles/PercentOffPlan.css";
import { useState } from "react";
import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

const PercentOffPlan = () => {
  const [discountType, setDiscountType] = useState("Percentage Off");

  const [appliesOn, setAppliesOn] = useState("All Items");

  const [timeType, setTimeType] = useState("allDay");

  return (
    <div className="merchant-percent-plan-container">

      <h2 className="merchant-percent-plan-title">
        % Off Plan
      </h2>

      <p className="merchant-percent-plan-description">
        Create percentage-based promotional offers.
      </p>

      <div className="merchant-percent-plan-form">

        {/* Plan Name */}

        <div className="merchant-percent-plan-group">

          <label>Plan Name</label>

          <input
            type="text"
            placeholder="20% OFF on all orders"
            className="merchant-percent-plan-input"
          />

        </div>

        {/* Discount */}

        <div className="merchant-percent-plan-two-column">

          <div className="merchant-percent-plan-group">

            <label>Discount Type</label>

            <select
              className="merchant-percent-plan-input"
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value)
              }
            >
              <option>Percentage Off</option>
            </select>

          </div>

          <div className="merchant-percent-plan-group">

            <label>Discount Value (%)</label>

            <input
              type="number"
              placeholder="20"
              className="merchant-percent-plan-input"
            />

          </div>

        </div>

        {/* Applies On */}

        <div className="merchant-percent-plan-group">

          <label>Applies On</label>

          <RadioGroup
            row
            value={appliesOn}
            onChange={(e) =>
              setAppliesOn(e.target.value)
            }
            className="merchant-percent-plan-applies-radio"
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

        </div>

        {/* Minimum Order */}

        <div className="merchant-percent-plan-group">

          <label>
            Minimum Order Value (Optional)
          </label>

          <input
            type="number"
            placeholder="499"
            className="merchant-percent-plan-input"
          />

        </div>

        {/* Select Time */}

        <div className="merchant-percent-plan-group">

          <label>Select Time</label>

          <RadioGroup
            row
            value={timeType}
            onChange={(e) =>
              setTimeType(e.target.value)
            }
            className="merchant-percent-plan-radio"
          >

            <FormControlLabel
              value="allDay"
              control={<Radio />}
              label="All Day"
            />

            <FormControlLabel
              value="custom"
              control={<Radio />}
              label="Custom Time"
            />

          </RadioGroup>

        </div>

        {/* Time Fields */}

        {timeType === "custom" && (

          <div className="merchant-percent-plan-two-column">

            <div className="merchant-percent-plan-group">

              <label>Start Time</label>

              <input
                type="time"
                className="merchant-percent-plan-input"
              />

              <small className="merchant-percent-plan-time-note">
                Example: 09:00 AM
              </small>

            </div>

            <div className="merchant-percent-plan-group">

              <label>End Time</label>

              <input
                type="time"
                className="merchant-percent-plan-input"
              />

              <small className="merchant-percent-plan-time-note">
                Example: 06:30 PM
              </small>

            </div>

          </div>

        )}

        {/* Date Fields */}

        <div className="merchant-percent-plan-two-column">

          <div className="merchant-percent-plan-group">

            <label>Start Date</label>

            <input
              type="date"
              className="merchant-percent-plan-input"
            />

          </div>

          <div className="merchant-percent-plan-group">

            <label>End Date (Optional)</label>

            <input
              type="date"
              className="merchant-percent-plan-input"
            />

          </div>

        </div>

        {/* Submit */}

        <div className="merchant-percent-plan-button-container">

          <Button
            variant="contained"
            className="merchant-percent-plan-submit"
          >
            Submit Plan
          </Button>

        </div>

      </div>

    </div>
  );
};

export default PercentOffPlan;