import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOutletsByMerchant } from "../../services/outletService";
import "../../styles/Outlets.css";

const Outlets = () => {
  const navigate = useNavigate();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = async () => {
    setLoading(true);
    try {
      const data = await getOutletsByMerchant();
      console.log("Outlets Data:", data);
      setOutlets(data || []);
    } catch (error) {
      console.error("Failed to fetch outlets", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Filter Logic (Search by Name/Phone/City and Status mapping `isApproved`)
  const filteredOutlets = outlets.filter((outlet) => {
    const matchesSearch =
      outlet.outletName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outlet.outletPhone?.includes(searchTerm) ||
      outlet.cityName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "APPROVED") return matchesSearch && outlet.isApproved === true;
    if (statusFilter === "PENDING") return matchesSearch && outlet.isApproved === false;
    return matchesSearch;
  });

  // 2. Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOutlets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOutlets.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="outlets-container">
      
      {/* Top Header Controls */}
      <div className="outlets-header">
        <h2>Outlets</h2>
        <div className="header-actions">
          <button onClick={loadOutlets} className="btn-refresh">🔄 Refresh</button>
          {/* <button onClick={() => navigate("/outlets/add")} className="btn-add">+ Add Outlet</button> */}
        <button
  onClick={() => navigate("/outlets/create")}
  className="btn-add"
>
  + Create Outlet
</button>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="filters-strip">
        <input
          type="text"
          className="search-input"
          placeholder="Search Outlet name, phone or city..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
        
        <select 
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="status-select"
        >
          <option value="ALL">All Status</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
        </select>

        <span className="total-count">Total: {filteredOutlets.length}</span>
      </div>

      {/* Data Presentation Table Area */}
      {loading ? (
        <p className="loading-text">Loading outlets...</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="outlets-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Outlet Name</th>
                  <th>Phone</th>
                  <th>State</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((outlet) => (
                    <tr key={outlet.outletId}>
                      <td>{outlet.outletId}</td>
                      <td className="outlet-name-cell">{outlet.outletName}</td>
                      <td>{outlet.outletPhone || "N/A"}</td>
                      <td>{outlet.stateName || "N/A"}</td>
                      <td>{outlet.cityName || "N/A"}</td>
                      <td>
                        <span className={`badge ${outlet.isApproved ? 'badge-approved' : 'badge-pending'}`}>
                          {outlet.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => navigate(`/outlets/view/${outlet.outletId}`)} className="btn-view">👁 View</button>
                          <button onClick={() => navigate(`/outlets/edit/${outlet.outletId}`)} className="btn-edit">✏ Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-cell">No outlets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div className="pagination-footer">
              <div>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOutlets.length)} of {filteredOutlets.length}
              </div>
              <div className="pagination-controls">
                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="btn-page">Previous</button>
                {[...Array(totalPages).keys()].map((num) => (
                  <button
                    key={num + 1}
                    onClick={() => handlePageChange(num + 1)}
                    className={`btn-page ${currentPage === num + 1 ? 'active' : ''}`}
                  >
                    {num + 1}
                  </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="btn-page">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Outlets;