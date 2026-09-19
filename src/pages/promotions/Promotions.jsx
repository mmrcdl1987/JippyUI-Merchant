import React, {
  useEffect,
  useState,
} from "react";

import {
  FaTags,
  FaChartLine,
} from "react-icons/fa";

import api from "../../services/api";

import PromotionForm from "./PromotionForm";
import PlansStatus from "./PlansStatus";

import "../../styles/Promotions.css";

import {
  getPromotionPlanTypes,
} from "../../services/promotionService";


const Promotions = () => {

  /* =========================================================
     ACTIVE PROMOTION
  ========================================================= */

  const [
    activeType,
    setActiveType,
  ] = useState(null);


  /* =========================================================
     PROMOTION TYPES
  ========================================================= */

  const [
    promotionTypes,
    setPromotionTypes,
  ] = useState([]);

  const [
    loadingPromotionTypes,
    setLoadingPromotionTypes,
  ] = useState(true);


  /* =========================================================
     MERCHANT OUTLETS
  ========================================================= */

  const [
    outlets,
    setOutlets,
  ] = useState([]);

  const [
    loadingOutlets,
    setLoadingOutlets,
  ] = useState(true);

  const [
    outletError,
    setOutletError,
  ] = useState("");


  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {

    fetchMerchantOutlets();

    fetchPromotionTypes();

  }, []);


  /* =========================================================
     GET MERCHANT OUTLETS
  ========================================================= */

  const fetchMerchantOutlets =
    async () => {

      try {

        setLoadingOutlets(true);
        setOutletError("");


        const merchantId =
          localStorage.getItem(
            "merchantId"
          );


        if (!merchantId) {

          throw new Error(
            "Merchant ID not found. Please login again."
          );

        }


        const response =
          await api.get(
            "/api/fm/outlets/getOutletsByMerchant",
            {
              params: {
                merchantId,
              },
            }
          );


        const result =
          response.data;


        let outletList = [];


        if (Array.isArray(result)) {

          outletList =
            result;

        } else if (
          Array.isArray(
            result?.data
          )
        ) {

          outletList =
            result.data;

        } else if (
          Array.isArray(
            result?.data?.content
          )
        ) {

          outletList =
            result.data.content;

        } else if (
          Array.isArray(
            result?.content
          )
        ) {

          outletList =
            result.content;

        }


        setOutlets(
          outletList
        );

      } catch (error) {

        console.error(
          "Error loading merchant outlets:",
          error
        );


        setOutletError(
          error.response?.data?.message ||
          error.message ||
          "Unable to load merchant outlets."
        );

      } finally {

        setLoadingOutlets(
          false
        );

      }

    };


  /* =========================================================
     GET PROMOTION PLAN TYPES
  ========================================================= */

  const fetchPromotionTypes =
    async () => {

      try {

        setLoadingPromotionTypes(
          true
        );


        const data =
          await getPromotionPlanTypes();


        let types = [];


        if (Array.isArray(data)) {

          types =
            data;

        } else if (
          Array.isArray(
            data?.data
          )
        ) {

          types =
            data.data;

        } else if (
          Array.isArray(
            data?.content
          )
        ) {

          types =
            data.content;

        } else if (
          Array.isArray(
            data?.data?.content
          )
        ) {

          types =
            data.data.content;

        }


        setPromotionTypes(
          types
        );

      } catch (error) {

        console.error(
          "Error loading promotion plan types:",
          error
        );

        setPromotionTypes([]);

      } finally {

        setLoadingPromotionTypes(
          false
        );

      }

    };


  /* =========================================================
     SELECT PROMOTION TYPE
  ========================================================= */

  const handlePromotionTypeSelect =
    (type) => {

      setActiveType({

        id:
          type.promotionPlanTypesId,

        title:
          type.planName,

      });

    };


  /* =========================================================
     EMPTY STATE
  ========================================================= */

  const renderEmptyState =
    () => {

      return (

        <div className="merchant-promotion-empty">

          <div className="merchant-promotion-empty-icon">

            <FaTags />

          </div>


          <h3>
            Select a Promotion
          </h3>


          <p>
            Choose a promotion type above
            to create a promotional offer.
          </p>

        </div>

      );

    };


  /* =========================================================
     PROMOTION FORM
  ========================================================= */

  const renderPromotionForm =
    () => {

      if (!activeType) {

        return renderEmptyState();

      }


      return (

        <PromotionForm

          promotionTypeId={
            activeType.id
          }

          promotionTypeName={
            activeType.title
          }

          outlets={
            outlets
          }

          loadingOutlets={
            loadingOutlets
          }

          outletError={
            outletError
          }

        />

      );

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="merchant-promotions-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="merchant-promotions-header">

        <div>

          <h1>
            Promotions
          </h1>

          <p>
            Create and manage promotional
            offers for your outlets.
          </p>

        </div>

      </div>


      {/* =====================================================
          OUTLET ERROR
      ===================================================== */}

      {outletError && (

        <div className="promotion-error">

          {outletError}

        </div>

      )}


      {/* =====================================================
          PROMOTION TYPE CARDS
      ===================================================== */}

      <div className="merchant-promotion-cards">

        {loadingPromotionTypes ? (

          <div className="promotion-types-loading">

            <span className="promotion-loading-dot" />

            Loading promotion types...

          </div>

        ) : promotionTypes.length === 0 ? (

          <div className="promotion-types-empty">

            No promotion types available.

          </div>

        ) : (

          promotionTypes.map(
            (type) => {

              const typeId =
                type.promotionPlanTypesId;


              const isActive =
                activeType?.id ===
                typeId;


              return (

                <button

                  key={typeId}

                  type="button"

                  className={`
                    merchant-promotion-card
                    ${
                      isActive
                        ? "merchant-promotion-card-active"
                        : ""
                    }
                  `}

                  onClick={() =>
                    handlePromotionTypeSelect(
                      type
                    )
                  }

                  disabled={
                    loadingOutlets ||
                    loadingPromotionTypes
                  }

                >

                  <div className="merchant-promotion-card-icon">

                    <FaTags />

                  </div>


                  <span>
                    {type.planName}
                  </span>

                </button>

              );

            }
          )

        )}


        {/* =================================================
            PLANS STATUS
        ================================================= */}

        <button

          type="button"

          className={`
            merchant-promotion-card
            merchant-promotion-status-card
            ${
              activeType?.key ===
              "status"
                ? "merchant-promotion-card-active"
                : ""
            }
          `}

          onClick={() => {

            setActiveType({

              id: "status",

              key: "status",

              title: "Plans Status",

            });

          }}

          disabled={
            loadingOutlets
          }

        >

          <div className="merchant-promotion-card-icon">

            <FaChartLine />

          </div>


          <span>
            Plans Status
          </span>

        </button>

      </div>


      {/* =====================================================
          FORM / STATUS CONTENT
      ===================================================== */}

      <div className="merchant-promotion-content">

        {activeType?.key ===
        "status" ? (

          <PlansStatus

            outlets={
              outlets
            }

            loadingOutlets={
              loadingOutlets
            }

            outletError={
              outletError
            }

          />

        ) : (

          renderPromotionForm()

        )}

      </div>


    </div>

  );

};


export default Promotions;