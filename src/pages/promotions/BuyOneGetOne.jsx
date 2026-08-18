import "../../styles/BuyOneGetOne.css";
import { useState } from "react";
import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

const BuyOneGetOne = () => {
  const [offerType, setOfferType] = useState("Buy 1 Get 1 Free");

  const [appliesOn, setAppliesOn] = useState("Selected Items");

  return (
    <div className="merchant-bogo-container">

      <h2 className="merchant-bogo-title">
        1+1 Offer
      </h2>

      <p className="merchant-bogo-description">
        Create Buy One Get One promotional offers.
      </p>

      <div className="merchant-bogo-form">

        {/* Plan Name */}

        <div className="merchant-bogo-group">

          <label>Plan Name</label>

          <input
            type="text"
            placeholder="Buy 1 Get 1 Free"
            className="merchant-bogo-input"
          />

        </div>

        {/* Offer Type */}

        <div className="merchant-bogo-two-column">

          <div className="merchant-bogo-group">

            <label>Offer Type</label>

            <select
              className="merchant-bogo-input"
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
            >
              <option>Buy 1 Get 1 Free</option>
              <option>Buy 2 Get 1 Free</option>
              <option>Buy 3 Get 1 Free</option>
            </select>

          </div>

          <div className="merchant-bogo-group">

            <label>Choose Items</label>

            <button
              type="button"
              className="merchant-bogo-select-button"
            >
              Choose Items (0)
            </button>

          </div>

        </div>

        {/* Applies On */}

        <div className="merchant-bogo-group">

          <label>Applies On</label>

         <RadioGroup
  row
  value={appliesOn}
  onChange={(e) => setAppliesOn(e.target.value)}
  className="merchant-bogo-applies-radio"
>

            <FormControlLabel
              value="Selected Items"
              control={<Radio />}
              label="Selected Items"
            />

            <FormControlLabel
              value="Selected Categories"
              control={<Radio />}
              label="Selected Categories"
            />

          </RadioGroup>

        </div>
                {/* Time */}

        <div className="merchant-bogo-two-column">

          <div className="merchant-bogo-group">

            <label>Start Time</label>

            <input
              type="time"
              className="merchant-bogo-input"
            />

          </div>

          <div className="merchant-bogo-group">

            <label>End Time</label>

            <input
              type="time"
              className="merchant-bogo-input"
            />

          </div>

        </div>

        {/* Dates */}

        <div className="merchant-bogo-two-column">

          <div className="merchant-bogo-group">

            <label>Start Date</label>

            <input
              type="date"
              className="merchant-bogo-input"
            />

          </div>

          <div className="merchant-bogo-group">

            <label>End Date (Optional)</label>

            <input
              type="date"
              className="merchant-bogo-input"
            />

          </div>

        </div>

        <Button
          variant="contained"
          className="merchant-bogo-submit"
        >
          Submit Plan
        </Button>

      </div>

    </div>
  );
};

export default BuyOneGetOne;