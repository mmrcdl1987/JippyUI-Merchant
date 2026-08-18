import "../../styles/Subscription.css";
import { useEffect, useState } from "react";
import {
  getSubscriptionPlans,
  deleteSubscriptionPlan,
  getSubscriptionPlanById,
  getAreaById,
} from "../../services/subscriptionService";


import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCrown,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";



const Subscription = () => {
  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState([]);
  useEffect(() => {
  fetchSubscriptionPlans();
}, []);

const navigate = useNavigate();

const fetchSubscriptionPlans = async () => {
  try {
    const response = await getSubscriptionPlans();

    setPlans(response.data || []);
  } catch (error) {
    console.error(error);
  }
};

const handleDelete = async (id) => {

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this subscription plan?"
  );

  if (!confirmDelete) {
    return;
  }

  try {

    await deleteSubscriptionPlan(id);

    alert("Subscription deleted successfully");

    fetchSubscriptionPlans();

  } catch (error) {

    console.error(error);

    alert(
      error.response?.data?.message ||
      "Failed to delete subscription."
    );

  }

};

const handleEdit = async (id) => {
  try {
    const response = await getSubscriptionPlanById(id);

    console.log(response);

    // Later we'll open EditSubscription page
  } catch (error) {
    console.error(error);
  }
};

const handleArea = async (areaId) => {
  try {
    const response = await getAreaById(areaId);

    console.log(response);
  } catch (error) {
    console.error(error);
  }
};
 

  const filteredPlans = plans.filter((plan) =>
  plan.planName?.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="merchant-subscription-container">
      <div className="merchant-subscription-header">
        <div>
          <h2 className="merchant-subscription-title">
            Subscription Plans
          </h2>

          <p className="merchant-subscription-subtitle">
            Manage merchant subscription plans and pricing.
          </p>
        </div>

        <button
    className="merchant-subscription-add-btn"
    onClick={() => navigate("/add-subscription")}
>
    Create Plan
</button>
      </div>

      <div className="merchant-subscription-toolbar">
        <div className="merchant-subscription-search">
          <FaSearch />

          <input
  type="text"
  placeholder="Search Plan..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
        </div>

        <div className="merchant-subscription-count">
          Total Plans
          <span>{filteredPlans.length}</span>
        </div>
      </div>

      <div className="merchant-subscription-table-wrapper">
        <table className="merchant-subscription-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Radius</th>
              <th>Banner</th>
              <th>Restaurant</th>
              <th>Deals</th>
              <th>WhatsApp</th>
              <th>Video</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => (
                <tr key={plan.subscriptionPlanId}>
                  <td>
                    <div className="merchant-subscription-plan">
                      <FaCrown />

                      <div>
                        <strong>{plan.planName}</strong>

                        <small>
                          {plan.bannerDurationInDays} Banner Days
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>₹{plan.price}</td>

                  <td>{plan.durationInDays} Days</td>

                  <td>{plan.radiusInKms} Km</td>

                  <td>{plan.bannerSlot}</td>

                  <td>{plan.bestRestaurantSlot}</td>

                  <td>{plan.dealsSlot}</td>

                  <td>{plan.whatsappBroadcast}</td>

                  <td>{plan.videoCredits}</td>

                  <td>
                    <div className="merchant-subscription-actions">
                      <button
    className="merchant-subscription-edit-btn"
    onClick={() => handleEdit(plan.subscriptionPlanId)}
>
    <FaEdit />
</button>

                     <button
    className="merchant-subscription-delete-btn"
    onClick={() => handleDelete(plan.subscriptionPlanId)}
>
    <FaTrash />
</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="merchant-subscription-no-data"
                  colSpan="10"
                >
                  No Subscription Plans Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subscription;