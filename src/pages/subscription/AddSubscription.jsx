import "../../styles/AddSubscription.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSubscriptionPlan } from "../../services/subscriptionService";

const AddSubscription = () => {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        subscriptionPlanId: 0,
        planName: "",
        price: "",
        durationInDays: "",
        bannerDurationInDays: "",
        radiusInKms: "",
        bannerSlot: "",
        bestRestaurantSlot: "",
        dealsSlot: "",
        whatsappBroadcast: "",
        videoCredits: "",
        areaId: "",
        userId: ""
    });

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await createSubscriptionPlan({

                subscriptionPlanId: 0,

                planName: formData.planName,

                price: Number(formData.price),

                durationInDays: Number(formData.durationInDays),

                bannerDurationInDays: Number(formData.bannerDurationInDays),

                radiusInKms: Number(formData.radiusInKms),

                bannerSlot: Number(formData.bannerSlot),

                bestRestaurantSlot: Number(formData.bestRestaurantSlot),

                dealsSlot: Number(formData.dealsSlot),

                whatsappBroadcast: formData.whatsappBroadcast,

                videoCredits: formData.videoCredits,

                areaId: Number(formData.areaId),

                userId: Number(formData.userId)

            });

            alert("Subscription Plan Created Successfully");

            navigate("/subscription");

        } catch (error) {

            console.error(error);

            alert(error.response?.data?.errors?.[0] || "Failed to create plan");

        }

    };

    return (

        <div className="merchant-add-subscription-container">

            <div className="merchant-add-subscription-header">

                <h2>Add Subscription Plan</h2>

                <p>Create a new subscription plan for merchants.</p>

            </div>

            <form
                className="merchant-add-subscription-form"
                onSubmit={handleSubmit}
            >                <div className="merchant-add-subscription-grid">

                    <div className="merchant-add-subscription-group">
                        <label>Plan Name</label>
                        <input
                            type="text"
                            name="planName"
                            value={formData.planName}
                            onChange={handleChange}
                          
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Price</label>
                        <input
                            type="number"
                            name="price"
                            min="1"
                            value={formData.price}
                            onChange={handleChange}
                         
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Duration (Days)</label>
                        <input
                            type="number"
                            name="durationInDays"
                            value={formData.durationInDays}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Banner Duration (Days)</label>
                        <input
                            type="number"
                            name="bannerDurationInDays"
                            value={formData.bannerDurationInDays}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Radius (Kms)</label>
                        <input
                            type="number"
                            name="radiusInKms"
                            value={formData.radiusInKms}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Banner Slot</label>
                        <input
                            type="number"
                            name="bannerSlot"
                            value={formData.bannerSlot}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Best Restaurant Slot</label>
                        <input
                            type="number"
                            name="bestRestaurantSlot"
                            value={formData.bestRestaurantSlot}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Deals Slot</label>
                        <input
                            type="number"
                            name="dealsSlot"
                            value={formData.dealsSlot}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>WhatsApp Broadcast</label>
                        <input
                            type="text"
                            name="whatsappBroadcast"
                            value={formData.whatsappBroadcast}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Video Credits</label>
                        <input
                            type="text"
                            name="videoCredits"
                            value={formData.videoCredits}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>Area Id</label>
                        <input
                            type="number"
                            name="areaId"
                            value={formData.areaId}
                            onChange={handleChange}
                            
                        />
                    </div>

                    <div className="merchant-add-subscription-group">
                        <label>User Id</label>
                        <input
                            type="number"
                            name="userId"
                            value={formData.userId}
                            onChange={handleChange}
                            
                        />
                    </div>

                </div>

                <div className="merchant-add-subscription-buttons">

                    <button
                        type="button"
                        className="merchant-add-subscription-cancel"
                        onClick={() => navigate("/subscription")}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="merchant-add-subscription-save"
                    >
                        Save Subscription
                    </button>

                </div>

            </form>

        </div>

    );

};

export default AddSubscription;