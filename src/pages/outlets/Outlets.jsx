import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOutletsByMerchant,
  getAdminOutletDetails,
  getOutletById,
  getOutletStatusById,
  getOutletImage,
  toggleOutlet,
} from "../../services/outletService";
import "../../styles/Outlets.css";

const getOutletImageUrl = (outlet) =>
  outlet?.outletPicUrl ||
  outlet?.outletProfilePic ||
  outlet?.outletProfilePicUrl ||
  outlet?.profilePicUrl ||
  outlet?.imageUrl ||
  outlet?.outletImageUrl ||
  outlet?.image ||
  null;

const extractOutletImageUrl = (response) => {
  const data =
    response?.data?.data ||
    response?.data ||
    response;

  return (
    getOutletImageUrl(data) ||
    data?.outlet?.outletPicUrl ||
    data?.outletDetails?.outletPicUrl ||
    (typeof data === "string" ? data : null)
  );
};

const extractOutletDetails = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;

  return (
    data?.outletDetails ??
    data?.outlet ??
    data?.merchantResponse ??
    data?.customerResponse ??
    data
  );
};

const toBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return ["true", "1", "y", "yes", "active", "enabled"].includes(
      value.trim().toLowerCase()
    );
  }

  return undefined;
};

const getOutletToggleValue = (outlet) =>
  toBoolean(
    outlet?.isToggle ??
      outlet?.is_toggle ??
      outlet?.isEnabled ??
      outlet?.is_enabled ??
      outlet?.isActive ??
      outlet?.is_active
  );

const extractOutletToggleValue = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;
  const candidates = [
    data,
    data?.outletDetails,
    data?.outlet,
    data?.merchantResponse,
    data?.customerResponse,
  ];

  for (const candidate of candidates) {
    const value = toBoolean(
      candidate?.isToggle ??
        candidate?.is_toggle ??
        candidate?.isEnabled ??
        candidate?.is_enabled
    );
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
};

const extractOutletActiveValue = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;
  const candidates = [
    data,
    data?.outletDetails,
    data?.outlet,
    data?.merchantResponse,
    data?.customerResponse,
  ];

  for (const candidate of candidates) {
    if (candidate?.isActive === "Y" || candidate?.is_active === "Y") {
      return true;
    }
    if (candidate?.isActive === "N" || candidate?.is_active === "N") {
      return false;
    }
  }

  return undefined;
};

const isOutletEnabled = (outlet) =>
  getOutletToggleValue(outlet) ?? false;

const Outlets = () => {
  const navigate = useNavigate();

  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [openingOutletId, setOpeningOutletId] = useState(null);
  const [togglingOutletId, setTogglingOutletId] = useState(null);

  // =========================================================
  // SEARCH AND FILTER STATES
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");

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
        const outletList = Array.isArray(data)
          ? data
          : data?.data || data?.outlets || [];

        const toggleResults = await Promise.all(
          outletList
            .filter((outlet) => outlet?.outletId)
            .map(async (outlet) => {
              try {
                const response = await getOutletStatusById(outlet.outletId);
                const details = extractOutletDetails(response);
                const isActive = extractOutletActiveValue(response);
                const currentToggle =
                  extractOutletToggleValue(response) ??
                  getOutletToggleValue(details);

                if (isActive === false && currentToggle === true) {
                  await toggleOutlet(outlet.outletId, false);
                }

                return {
                  outletId: outlet.outletId,
                  isToggle: isActive === false ? false : currentToggle,
                  isActive,
                };
              } catch (error) {
                console.warn(
                  `Unable to load toggle status for outlet ${outlet.outletId}:`,
                  error
                );
                return {
                  outletId: outlet.outletId,
                  isToggle: undefined,
                  isActive: undefined,
                };
              }
            })
        );

        const toggleByOutletId = new Map(
          toggleResults
            .filter((result) => typeof result.isToggle === "boolean")
            .map((result) => [
              String(result.outletId),
              result.isToggle,
            ])
        );
        const activeByOutletId = new Map(
          toggleResults
            .filter((result) => typeof result.isActive === "boolean")
            .map((result) => [String(result.outletId), result.isActive])
        );

        const outletsWithToggle = outletList.map((outlet) => ({
          ...outlet,
          ...(toggleByOutletId.has(String(outlet.outletId))
            ? { isToggle: toggleByOutletId.get(String(outlet.outletId)) }
            : {}),
          ...(activeByOutletId.has(String(outlet.outletId))
            ? { isActive: activeByOutletId.get(String(outlet.outletId)) ? "Y" : "N" }
            : {}),
        }));

        setOutlets(outletsWithToggle);

        const outletsWithoutImages = outletsWithToggle.filter(
          (outlet) =>
            outlet?.outletId &&
            !getOutletImageUrl(outlet)
        );

        if (outletsWithoutImages.length > 0) {
          const imageResults = await Promise.all(
            outletsWithoutImages.map(async (outlet) => {
              try {
                const imageResponse = await getOutletImage(
                  outlet.outletId
                );
                return {
                  outletId: outlet.outletId,
                  outletPicUrl: extractOutletImageUrl(imageResponse),
                };
              } catch (error) {
                console.warn(
                  `Unable to load image for outlet ${outlet.outletId}:`,
                  error
                );
                return {
                  outletId: outlet.outletId,
                  outletPicUrl: null,
                };
              }
            })
          );

          const imageByOutletId = new Map(
            imageResults
              .filter((result) => result.outletPicUrl)
              .map((result) => [
                String(result.outletId),
                result.outletPicUrl,
              ])
          );

          if (imageByOutletId.size > 0) {
            setOutlets((currentOutlets) =>
              currentOutlets.map((outlet) => ({
                ...outlet,
                outletPicUrl:
                  getOutletImageUrl(outlet) ||
                  imageByOutletId.get(
                    String(outlet.outletId)
                  ),
              }))
            );
          }
        }
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

      // navigate(
      //   `/outlets/view/${outletId}`
      // );


      navigate(`/outlets/profile/${outletId}`);

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

      const matchesActive =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE"
          ? outlet.isActive === "Y"
          : outlet.isActive === "N");

      // Approved
      if (statusFilter === "APPROVED") {
        return (
          matchesSearch &&
          matchesActive &&
          outlet.isApproved === true
        );
      }

      // Pending
      if (statusFilter === "PENDING") {
        return (
          matchesSearch &&
          matchesActive &&
          outlet.isApproved === false
        );
      }

      // All
      return matchesSearch && matchesActive;
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
  };

  const handleActiveFilterChange = (e) => {
    setActiveFilter(e.target.value);
    setCurrentPage(1);
    setCurrentPage(1);
  };

  const handleOutletToggle = async (outlet) => {
    const outletId = outlet?.outletId;
    if (!outletId) {
      setErrorMsg("Outlet ID is missing.");
      return;
    }
    if (outlet.isActive !== "Y") {
      return;
    }

    const nextStatus = !isOutletEnabled(outlet);

    try {
      setTogglingOutletId(outletId);
      setErrorMsg(null);
      await toggleOutlet(outletId, nextStatus);
      setOutlets((currentOutlets) =>
        currentOutlets.map((currentOutlet) =>
          currentOutlet.outletId === outletId
            ? { ...currentOutlet, isToggle: nextStatus }
            : currentOutlet
        )
      );
    } catch (error) {
      console.error("Failed to update outlet status:", error);
      setErrorMsg(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update outlet status."
      );
    } finally {
      setTogglingOutletId(null);
    }
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

        <select
          value={activeFilter}
          onChange={handleActiveFilterChange}
          className="status-select"
        >
          <option value="ALL">All Active Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
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
                    City
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    isToggle
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
                        className={outlet.isActive === "N" ? "outlet-row-inactive" : ""}
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

                            {getOutletImageUrl(outlet) && (
                              <img
                                src={getOutletImageUrl(outlet)}
                                alt=""
                                className="outlet-list-image"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                  event.currentTarget.nextElementSibling.style.display = "inline-flex";
                                }}
                              />
                            )}
                            <span
                              className="outlet-list-image outlet-list-image-placeholder"
                              style={{
                                display: getOutletImageUrl(outlet)
                                  ? "none"
                                  : "inline-flex",
                              }}
                            >
                              {(outlet.outletName || "O").charAt(0).toUpperCase()}
                            </span>
                            <span>
                              {outlet.outletName || "N/A"}
                            </span>
                            <span
                              className={`outlet-active-badge ${
                                outlet.isActive === "Y"
                                  ? "outlet-active-badge-active"
                                  : "outlet-active-badge-inactive"
                              }`}
                            >
                              {outlet.isActive === "Y" ? "Active" : "Inactive"}
                            </span>

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
                            CITY
                            ================================================= */}

                        <td>
                          {
                            outlet.cityName ||
                            "N/A"
                          }
                        </td>

                        {/* =================================================
                            OUTLET STATUS
                            ================================================= */}

                        <td>
                          <span
                            className={`badge ${
                              outlet.isApproved === true
                                ? "badge-approved"
                                : outlet.isApproved === false
                                ? "badge-pending"
                                : "badge-unknown"
                            }`}
                          >
                            {outlet.isApproved === true
                              ? "Approved"
                              : outlet.isApproved === false
                              ? "Pending"
                              : "Unknown"}
                          </span>
                        </td>

                        {/* =================================================
                            ACTIVE STATUS
                            ================================================= */}

                        <td>
                          <button
                            type="button"
                            className={`outlet-toggle ${
                              isOutletEnabled(outlet)
                                ? "active"
                                : "inactive"
                            }`}
                            onClick={() => handleOutletToggle(outlet)}
                            disabled={
                              outlet.isActive !== "Y" ||
                              togglingOutletId === outlet.outletId
                            }
                            title={
                              outlet.isActive !== "Y"
                                ? "Activate the outlet before changing isToggle"
                                : `Mark outlet ${
                                    isOutletEnabled(outlet)
                                      ? "inactive"
                                      : "active"
                                  }`
                            }
                          >
                            <span className="outlet-toggle-track">
                              <span className="outlet-toggle-thumb" />
                            </span>
                          </button>

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
                              disabled={outlet.isApproved !== true}
                              title={
                                outlet.isApproved !== true
                                  ? "Outlet has not approved yet to edit"
                                  : "Edit outlet"
                              }
                            >
                              {outlet.isApproved === true
                                ? "✏ Edit"
                                : "Edit"}
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