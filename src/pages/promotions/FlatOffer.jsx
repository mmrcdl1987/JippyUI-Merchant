import "../../styles/FlatOffer.css";
import { useState } from "react";
import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

const FlatOffer = () => {
  const [discountType, setDiscountType] = useState("Flat Amount");
  const [appliesOn, setAppliesOn] = useState("All Items");

  return (
    <div className="merchant-flat-container">

      <h2 className="merchant-flat-title">
        Flat Offer
      </h2>

      <p className="merchant-flat-description">
        Create flat amount discount offers for your customers.
      </p>

      <div className="merchant-flat-form">

        {/* Plan Name */}

        <div className="merchant-flat-group">

          <label>Plan Name</label>

          <input
            type="text"
            placeholder="Flat ₹100 OFF"
            className="merchant-flat-input"
          />

        </div>

        {/* Discount */}

        <div className="merchant-flat-two-column">

          <div className="merchant-flat-group">

            <label>Discount Type</label>

            <select
              className="merchant-flat-input"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <option>Flat Amount</option>
            </select>

          </div>

          <div className="merchant-flat-group">

            <label>Flat Amount</label>

            <input
              type="number"
              placeholder="100"
              className="merchant-flat-input"
            />

          </div>

        </div>

        {/* Minimum Order */}

        <div className="merchant-flat-group">

          <label>Minimum Order Value</label>

          <input
            type="number"
            placeholder="500"
            className="merchant-flat-input"
          />

        </div>

        {/* Applies On */}

        <div className="merchant-flat-group">

          <label>Applies On</label>

          <RadioGroup
            row
            value={appliesOn}
            onChange={(e) => setAppliesOn(e.target.value)}
            className="merchant-flat-applies-radio"
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
                {/* Time */}

        <div className="merchant-flat-two-column">

          <div className="merchant-flat-group">

            <label>Start Time</label>

            <input
              type="time"
              className="merchant-flat-input"
            />

          </div>

          <div className="merchant-flat-group">

            <label>End Time</label>

            <input
              type="time"
              className="merchant-flat-input"
            />

          </div>

        </div>

        {/* Dates */}

        <div className="merchant-flat-two-column">

          <div className="merchant-flat-group">

            <label>Start Date</label>

            <input
              type="date"
              className="merchant-flat-input"
            />

          </div>

          <div className="merchant-flat-group">

            <label>End Date (Optional)</label>

            <input
              type="date"
              className="merchant-flat-input"
            />

          </div>

        </div>

        <Button
          variant="contained"
          className="merchant-flat-submit"
        >
          Submit Plan
        </Button>

      </div>

    </div>
  );
};

export default FlatOffer;