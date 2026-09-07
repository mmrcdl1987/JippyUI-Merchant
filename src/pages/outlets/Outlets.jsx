import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOutletsByMerchant, getAdminOutletDetails } from "../../services/outletService";
import "../../styles/Outlets.css";

const Outlets = () => {
  const navigate = useNavigate();

  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [openingOutletId, setOpeningOutletId] = useState(null);

  // =========================================================
  // SEARCH AND FILTER STATES
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // =========================================================
  // PAGINATION STATES
  // =========================================================

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // =========================================================
  // LOAD OUTLETS
  // =========================================================

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await getOutletsByMerchant();

      console.log("Outlets Data:", data);

      // Backend returning success: false
      if (data && data.success === false) {
        setErrorMsg(
          data.message || "Failed to fetch outlets."
        );

        setOutlets([]);
      } else {
        setOutlets(
          Array.isArray(data) ? data : []
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch outlets:",
        error
      );

      if (error.response?.data?.message) {
        setErrorMsg(
          error.response.data.message
        );
      } else if (error.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg(
          "An unexpected error occurred while fetching outlets."
        );
      }

      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // OPEN OUTLET PROFILE
  //
  // IMPORTANT:
  // OutletProfileDetails currently reads the selected
  // outlet from sessionStorage using "selectedOutlet".
  //
  // So before navigating, save the complete outlet object.
  // =========================================================

  const openOutletProfile = async (outlet) => {
    if (!outlet) {
      console.error(
        "Outlet data is missing."
      );
      return;
    }

    if (!outlet.outletId) {
      console.error(
        "Outlet ID is missing:",
        outlet
      );
      return;
    }

    const outletId = outlet.outletId;

    try {
      setOpeningOutletId(outletId);

      console.log(
        "========================================"
      );

      console.log(
        "OPENING OUTLET PROFILE"
      );

      console.log(
        "Outlet ID:",
        outletId
      );

      console.log(
        "Calling Admin Outlet Details API..."
      );

      console.log(
        "GET /api/fm/outlets/admin/outlet-details?outletId=",
        outletId
      );

      // =====================================================
      // CALL ADMIN COMPLETE OUTLET DETAILS API
      // =====================================================

      const adminResponse =
        await getAdminOutletDetails(outletId);

      console.log(
        "ADMIN OUTLET DETAILS RESPONSE:",
        adminResponse
      );

      // =====================================================
      // NORMALIZE POSSIBLE RESPONSE STRUCTURES
      // =====================================================

      let completeOutlet =
        adminResponse?.data?.data ??
        adminResponse?.data ??
        adminResponse?.outletDetails ??
        adminResponse?.outlet ??
        adminResponse ??
        null;

      // Handle backend success:false response
      if (
        completeOutlet &&
        completeOutlet.success === false
      ) {
        throw new Error(
          completeOutlet.message ||
          "Unable to load outlet details."
        );
      }

      // =====================================================
      // MERGE LIST DATA + ADMIN DATA
      //
      // This keeps fields from the outlet list if the Admin
      // response does not contain a particular field.
      // =====================================================

      completeOutlet = {
        ...outlet,
        ...(completeOutlet || {}),
        outletId:
          completeOutlet?.outletId ??
          outletId,
      };

      console.log(
        "FINAL SELECTED OUTLET:",
        completeOutlet
      );

      // =====================================================
      // SAVE COMPLETE OUTLET DATA
      //
      // OutletProfileDetails can use this data immediately.
      // =====================================================

      sessionStorage.setItem(
        "selectedOutlet",
        JSON.stringify(
          completeOutlet
        )
      );

      // =====================================================
      // OPEN OUTLET PROFILE
      // =====================================================

      navigate(
        `/outlets/view/${outletId}`
      );

    } catch (error) {
      console.error(
        "Failed to load complete outlet details:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load outlet details.";

      setErrorMsg(message);

    } finally {
      setOpeningOutletId(null);
    }
  };

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredOutlets = outlets.filter(
    (outlet) => {
      const searchValue =
        searchTerm.toLowerCase().trim();

      const matchesSearch =
        outlet.outletName
          ?.toLowerCase()
          .includes(searchValue) ||
        outlet.outletPhone
          ?.toString()
          .includes(searchValue) ||
        outlet.cityName
          ?.toLowerCase()
          .includes(searchValue) ||
        outlet.stateName
          ?.toLowerCase()
          .includes(searchValue);

      // Approved
      if (statusFilter === "APPROVED") {
        return (
          matchesSearch &&
          outlet.isApproved === true
        );
      }

      // Pending
      if (statusFilter === "PENDING") {
        return (
          matchesSearch &&
          outlet.isApproved === false
        );
      }

      // All
      return matchesSearch;
    }
  );

  // =========================================================
  // PAGINATION
  // =========================================================

  const indexOfLastItem =
    currentPage * itemsPerPage;

  const indexOfFirstItem =
    indexOfLastItem - itemsPerPage;

  const currentItems =
    filteredOutlets.slice(
      indexOfFirstItem,
      indexOfLastItem
    );

  const totalPages = Math.ceil(
    filteredOutlets.length /
      itemsPerPage
  );

  const handlePageChange = (
    pageNumber
  ) => {
    setCurrentPage(pageNumber);
  };

  // =========================================================
  // SEARCH CHANGE
  // =========================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // =========================================================
  // STATUS CHANGE
  // =========================================================

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="outlets-container">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="outlets-header">

        <h2>Outlets</h2>

        <div className="header-actions">

          {/* REFRESH */}

          <button
            type="button"
            onClick={loadOutlets}
            className="btn-refresh"
            disabled={loading}
          >
            🔄{" "}
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          {/* CREATE OUTLET */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/outlets/create"
              )
            }
            className="btn-add"
          >
            + Create Outlet
          </button>

        </div>

      </div>

      {/* =====================================================
          BACKEND ERROR / WARNING
          ===================================================== */}

      {errorMsg && (
        <div
          className="backend-error-banner"
          style={{
            backgroundColor:
              "#fff3cd",
            color: "#856404",
            padding:
              "15px 20px",
            borderRadius: "6px",
            border:
              "1px solid #ffeeba",
            marginBottom: "20px",
            display: "flex",
            flexDirection:
              "column",
            gap: "5px",
          }}
        >

          <strong>
            ⚠️ Notice
          </strong>

          <span>
            {errorMsg}
          </span>

        </div>
      )}

      {/* =====================================================
          SEARCH AND FILTERS
          ===================================================== */}

      <div className="filters-strip">

        {/* SEARCH */}

        <input
          type="text"
          className="search-input"
          placeholder="Search Outlet name, phone or city..."
          value={searchTerm}
          onChange={
            handleSearchChange
          }
        />

        {/* STATUS */}

        <select
          value={statusFilter}
          onChange={
            handleStatusChange
          }
          className="status-select"
        >

          <option value="ALL">
            All Status
          </option>

          <option value="APPROVED">
            Approved
          </option>

          <option value="PENDING">
            Pending
          </option>

        </select>

        {/* TOTAL */}

        <span className="total-count">
          Total:{" "}
          {filteredOutlets.length}
        </span>

      </div>

      {/* =====================================================
          TABLE / LOADING
          ===================================================== */}

      {loading ? (

        <p className="loading-text">
          Loading outlets...
        </p>

      ) : (

        <>

          <div className="table-wrapper">

            <table className="outlets-table">

              {/* =================================================
                  TABLE HEADER
                  ================================================= */}

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Outlet Name
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    State
                  </th>

                  <th>
                    City
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              {/* =================================================
                  TABLE BODY
                  ================================================= */}

              <tbody>

                {currentItems.length > 0 ? (

                  currentItems.map(
                    (outlet) => (

                      <tr
                        key={
                          outlet.outletId
                        }
                      >

                        {/* =================================================
                            ID
                            ================================================= */}

                        <td>
                          {
                            outlet.outletId
                          }
                        </td>

                        {/* =================================================
                            OUTLET NAME
                            
                            Click → OutletProfileDetails
                            ================================================= */}

                        <td className="outlet-name-cell">

                          <button
                            type="button"
                            className="outlet-name-link"
                            onClick={() =>
                              openOutletProfile(
                                outlet
                              )
                            }
                            title="View Outlet Details"
                          >

                            {
                              outlet.outletName ||
                              "N/A"
                            }

                          </button>

                        </td>

                        {/* =================================================
                            PHONE
                            ================================================= */}

                        <td>
                          {
                            outlet.outletPhone ||
                            "N/A"
                          }
                        </td>

                        {/* =================================================
                            STATE
                            ================================================= */}

                        <td>
                          {
                            outlet.stateName ||
                            "N/A"
                          }
                        </td>

                        {/* =================================================
                            CITY
                            ================================================= */}

                        <td>
                          {
                            outlet.cityName ||
                            "N/A"
                          }
                        </td>

                        {/* =================================================
                            STATUS
                            ================================================= */}

                        <td>

                          <span
                            className={`badge ${
                              outlet.isApproved
                                ? "badge-approved"
                                : "badge-pending"
                            }`}
                          >

                            {
                              outlet.isApproved
                                ? "Approved"
                                : "Pending"
                            }

                          </span>

                        </td>

                        {/* =================================================
                            ACTION BUTTONS
                            ================================================= */}

                        <td>

                          <div className="action-buttons">

                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() =>
                                openOutletProfile(
                                  outlet
                                )
                              }
                              className="btn-view"
                              disabled={
                                openingOutletId ===
                                outlet.outletId
                              }
                            >
                              {openingOutletId ===
                              outlet.outletId
                                ? "Loading..."
                                : "👁 View"}
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/outlets/edit/${outlet.outletId}`
                                )
                              }
                              className="btn-edit"
                            >
                              ✏ Edit
                            </button>

                          </div>

                        </td>

                      </tr>

                    )

                  )

                ) : (

                  /* =================================================
                     EMPTY STATE
                     ================================================= */

                  <tr>

                    <td
                      colSpan="7"
                      className="empty-cell"
                    >

                      {errorMsg
                        ? errorMsg
                        : "No outlets found."}

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* =====================================================
              PAGINATION
              ===================================================== */}

          {totalPages > 1 && (

            <div className="pagination-footer">

              {/* SHOWING */}

              <div>

                Showing{" "}

                {indexOfFirstItem + 1}

                {" "}to{" "}

                {Math.min(
                  indexOfLastItem,
                  filteredOutlets.length
                )}

                {" "}of{" "}

                {filteredOutlets.length}

              </div>

              {/* PAGINATION CONTROLS */}

              <div className="pagination-controls">

                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    handlePageChange(
                      currentPage - 1
                    )
                  }
                  className="btn-page"
                >
                  Previous
                </button>

                {/* PAGE NUMBERS */}

                {[
                  ...Array(
                    totalPages
                  ).keys(),
                ].map(
                  (num) => (

                    <button
                      type="button"
                      key={
                        num + 1
                      }
                      onClick={() =>
                        handlePageChange(
                          num + 1
                        )
                      }
                      className={`btn-page ${
                        currentPage ===
                        num + 1
                          ? "active"
                          : ""
                      }`}
                    >
                      {
                        num + 1
                      }
                    </button>

                  )
                )}

                {/* NEXT */}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    handlePageChange(
                      currentPage + 1
                    )
                  }
                  className="btn-page"
                >
                  Next
                </button>

              </div>

            </div>

          )}

        </>

      )}

    </div>
  );
};

export default Outlets;