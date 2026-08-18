import "../../styles/SlotBooking.css";

import {
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
} from "@mui/material";

const SlotBooking = () => {
  return (
    <div className="merchant-slot-booking-main-container">

      {/* Header */}

      <h2 className="merchant-slot-booking-title">
        Slot Booking
      </h2>

      <p className="merchant-slot-booking-description">
        Offer customers special price during specific time slots.
      </p>

      <div className="merchant-slot-booking-form-container">

        {/* =========================
            Date Range
        ========================== */}

        <div className="merchant-slot-booking-bottom-fields">

          <div className="merchant-slot-booking-form-group">
            <label className="merchant-slot-booking-label">
              Start Date
            </label>

            <input
              type="date"
              className="merchant-slot-booking-input merchant-slot-booking-date"
            />
          </div>

          <div className="merchant-slot-booking-form-group">
            <label className="merchant-slot-booking-label">
              End Date
            </label>

            <input
              type="date"
              className="merchant-slot-booking-input merchant-slot-booking-date"
            />
          </div>

        </div>

        {/* =========================
            Time Slots
        ========================== */}

        <div className="merchant-slot-booking-form-group">

          <label className="merchant-slot-booking-label">
            Select Time Slots
          </label>

          <div className="merchant-slot-booking-time-row">

            <Checkbox />

            <span className="merchant-slot-booking-time-text">
              11:00 AM - 02:00 PM
            </span>

            <input
              type="number"
              placeholder="15"
              className="merchant-slot-booking-discount-input"
            />

            <span>%</span>

          </div>

          <div className="merchant-slot-booking-time-row">

            <Checkbox />

            <span className="merchant-slot-booking-time-text">
              05:00 PM - 09:00 PM
            </span>

            <input
              type="number"
              placeholder="20"
              className="merchant-slot-booking-discount-input"
            />

            <span>%</span>

          </div>

          <div className="merchant-slot-booking-time-row">

            <Checkbox />

            <span className="merchant-slot-booking-time-text">
              09:00 PM - 11:00 PM
            </span>

            <input
              type="number"
              placeholder="10"
              className="merchant-slot-booking-discount-input"
            />

            <span>%</span>

          </div>

        </div>

                {/* =========================
            Applies On
        ========================== */}

        <div className="merchant-slot-booking-form-group">

          <label className="merchant-slot-booking-label">
            Applies On
          </label>

          <div className="merchant-slot-booking-radio-container">

            <RadioGroup row defaultValue="allItems">

              <FormControlLabel
                value="allItems"
                control={<Radio />}
                label="All Items"
              />

              <FormControlLabel
                value="selectedCategories"
                control={<Radio />}
                label="Selected Categories"
              />

              <FormControlLabel
                value="selectedItems"
                control={<Radio />}
                label="Selected Items"
              />

            </RadioGroup>

          </div>

        </div>

        {/* =========================
            Bottom Fields
        ========================== */}

        <div className="merchant-slot-booking-bottom-fields">

          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              Minimum Order Value (Optional)
            </label>

            <input
              type="number"
              placeholder="200"
              className="merchant-slot-booking-input"
            />

          </div>

          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              Offer Name
            </label>

            <input
              type="text"
              placeholder="Lunch & Dinner Special"
              className="merchant-slot-booking-input"
            />

          </div>

        </div>

        {/* =========================
            Submit Button
        ========================== */}

        <div className="merchant-slot-booking-button-container">

          <Button
            variant="contained"
            className="merchant-slot-booking-submit-button"
          >
            Submit
          </Button>

        </div>

      </div>

    </div>
  );
};

export default SlotBooking;