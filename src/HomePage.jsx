import React, { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { MdCall } from "react-icons/md";
import { FaTwitter, FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";

import marathonBg from "./Images/image4.jpg";
import tanukuLogo from "./Images/img1.png";

export default function HomePage() {
  const formRef = useRef(null);
  const footerRef = useRef(null);
  const aboutRef = useRef(null);

  const [showAbout, setShowAbout] = useState(false);
  const [showEdition, setShowEdition] = useState(false);
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    runType: "",
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    city: "",
    bloodGroup: "",
    tshirtSize: "",
  });

  const [price, setPrice] = useState(0); // rupees display
  const [loading, setLoading] = useState(false);

  // Client-side display mapping (server authoritative)
  const priceMapping = {
    "3K": 250,
    "5K": 300,
    "10K": 350
    ,
  };

  useEffect(() => {
    const imageModules = import.meta.glob(
      "./SELECTEDWEBSITE/*.{png,jpg,jpeg,gif,svg,JPG,JPEG}",
      { eager: true }
    );
    const imageUrls = Object.values(imageModules).map((mod) => mod.default);
    setImages(imageUrls);
    fetch('https://qt5xd4-5000.csb.app/api/health')
    

  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "runType") {
      setPrice(priceMapping[value] || 0);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToFooter = () => footerRef.current?.scrollIntoView({ behavior: "smooth" });
  const handleAboutClick = () => { setShowAbout(true); setTimeout(() => aboutRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validations
    if (!form.runType) { alert("Please select Run Type."); return; }
    if (!/^\d{10}$/.test(form.phone)) { alert("Please enter a valid 10-digit phone number."); return; }
    if (!/^\d{1,3}$/.test(String(form.age))) { alert("Please enter a valid age."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { alert("Please enter a valid email address."); return; }

    setLoading(true);

    try {
      // ask backend to create order
      const createRes = await fetch("https://qt5xd4-5000.csb.app/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceType: form.runType })
      });

      const orderData = await createRes.json();
      if (!orderData || !orderData.success) {
        console.error("create-order returned:", orderData);
        alert(orderData?.error || "Failed to create order. Try again.");
        setLoading(false);
        return;
      }

      const orderId = orderData.orderId;
      const amountPaise = orderData.amount;
      const key = orderData.key || "rzp_test_E88wJ7EdIC51XD";

      if (!orderId || !amountPaise) {
        alert("Invalid order response.");
        setLoading(false);
        return;
      }

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert("Razorpay SDK failed to load.");
        setLoading(false);
        return;
      }

      const options = {
        key,
        amount: amountPaise,
        currency: "INR",
        name: "Tanuku Road Run 2025",
        description: `${form.runType} Registration`,
        order_id: orderId,
        handler: async function (response) {
          // Save registration to backend (backend will verify the signature and fetch payment status)
          try {
            const saveRes = await fetch("https://qt5xd4-5000.csb.app/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...form,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              })
            });

            const saveJson = await saveRes.json();
            if (saveRes.ok && saveJson.success) {
              alert("Registration & Payment successful!");
              setForm({
                runType: "",
                name: "",
                email: "",
                phone: "",
                age: "",
                gender: "",
                city: "",
                bloodGroup: "",
                tshirtSize: "",
              });
              setPrice(0);
            } else {
              console.error("Save registration failed:", saveJson);
              alert(saveJson.error || "Payment succeeded but saving registration failed.");
            }
          } catch (err) {
            console.error("Error saving registration:", err);
            alert("Error saving registration. Contact admin.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: form.name || "",
          email: form.email || "",
          contact: form.phone || ""
        },
        notes: { raceType: form.runType },
        theme: { color: "#F37254" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert("Something went wrong while initiating payment. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-fixed bg-cover bg-center" style={{ backgroundImage: `url(${marathonBg})` }}>
      {/* Marquee */}
      <div className="bg-black bg-opacity-70 text-white font-semibold py-6 overflow-hidden relative">
        <div className="animate-marquee whitespace-nowrap">Registration opening soon for 2nd edition!Stay Tuned &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      </div>

      {/* Header */}
      <nav className="flex justify-between items-center bg-black bg-opacity-70 px-6 py-4 relative">
        <div className="flex items-center space-x-4">
          <img src={tanukuLogo} alt="Tanuku Logo" style={{ height: "80px" }} className="object-contain" />
          <button className="bg-white text-black px-4 py-2 rounded font-bold" onClick={() => window.location.reload()}>HOME</button>
          <button onClick={() => setShowEdition(true)} className="bg-white text-black px-4 py-2 rounded font-bold">1st EDITION</button>
        </div>
        <div className="flex space-x-4">
          <button className="bg-white text-black px-4 py-2 rounded font-semibold" onClick={handleAboutClick}>ABOUT US</button>
          <button className="bg-white text-black px-4 py-2 rounded font-semibold" onClick={scrollToFooter}>CONTACT US</button>
        </div>
      </nav>

      {/* Banner */}
      <div className="text-center bg-black bg-opacity-60 text-white h-screen flex flex-col justify-center px-6">
        <h1 className="text-3xl font-bold mb-4">Join Tanuku Run 2025</h1>
        <p className="mb-6">Run with passion. Register now and be a part of the biggest community run in Tanuku!</p>
        <button onClick={scrollToForm} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded text-lg self-center">REGISTER NOW</button>
      </div>

      {/* Main Section */}
      <main ref={formRef} className="flex-grow flex flex-col md:flex-row items-center justify-between px-8 pt-12 bg-white bg-opacity-90">
        {/* Registration Form */}
        <div className="text-center w-full md:w-3/5 mb-10 md:mb-0">
          <h2 className="text-2xl font-bold mb-4 text-red-600 bg-white inline-block px-4 py-2 rounded shadow">Register for Tanuku Run 2025</h2>

          <form onSubmit={handleSubmit} className="p-6 rounded shadow-md space-y-4 max-w-md mx-auto bg-white">
            <select required name="runType" value={form.runType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded">
              <option value="">Select Run Type</option>
              <option value="3K">3K</option>
              <option value="5K">5K</option>
              <option value="10K">10K</option>
            </select>

            <div className="text-left">
              <p className="text-sm text-gray-600 mt-1"><strong>Price:</strong> {price > 0 ? `₹${price}` : "Select run type"}</p>
            </div>

            <input required type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" />
            <input required type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" />
            <input required type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" maxLength={10} />
            <input required type="number" name="age" placeholder="Age" value={form.age} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" min={1} max={120} />
            <select required name="gender" value={form.gender} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input required type="text" name="city" placeholder="City" value={form.city} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" />
            <input required type="text" name="bloodGroup" placeholder="Blood Group" value={form.bloodGroup} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" />
            <select required name="tshirtSize" value={form.tshirtSize} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded">
              <option value="">Select T-Shirt Size</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>

            <button type="submit" disabled={loading || !form.runType} className="bg-yellow-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded w-full">
              {loading ? "Processing..." : "Register & Proceed to pay"}
            </button>
          </form>
        </div>

        {/* Slider */}
        <div className="w-full md:w-2/5 flex justify-center">
          <Swiper modules={[Navigation]} navigation spaceBetween={20} slidesPerView={1} loop={true} className="w-[100vw] md:w-[550px] h-[500px] rounded shadow-md">
            {images.length === 0 ? (
              <p className="text-center pt-20">Loading images...</p>
            ) : (
              images.map((imgSrc, idx) => (
                <SwiperSlide key={idx}>
                  <img src={imgSrc} className="w-full h-full object-contain rounded bg-white bg-gray-50" alt={`Slide ${idx + 1}`} />
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </div>
      </main>

      {/* About, edition popup, footer unchanged */}
      {showAbout && (
        <section ref={aboutRef} className="bg-white bg-opacity-90 text-black px-8 py-6 max-w-4xl mx-auto mt-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Tanuku Road Run – A Movement Born for the Future మనా ఊరు – మన పరుగు</h2>
          <p>The Tanuku Road Run began with a simple yet powerful idea — to bring a culture of fitness, unity, and purpose to the heart of West Godavari...</p>
        </section>
      )}

      {showEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full relative animate-fade-in">
            <button onClick={() => setShowEdition(false)} className="absolute top-2 right-3 text-gray-800 text-2xl font-bold hover:text-red-500">&times;</button>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Tanuku Road Run – 1st Edition</h2>
            <p className="text-gray-800 leading-relaxed text-sm md:text-base whitespace-pre-line">The first-ever Tanuku Road Run was held on December 8, 2024...</p>
          </div>
        </div>
      )}

      <footer ref={footerRef} className="bg-black text-white py-8 mt-12 flex items-center justify-between px-8">
        <div className="flex space-x-6 text-lg">
          <a href="tel:+919629050142" className="flex items-center space-x-1 hover:text-green-400"><MdCall size={30} /> <span>+91 96290 50142</span></a>
          <a href="https://wa.me/919629050142" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-green-500"><FaWhatsapp size={30} /> <span>WhatsApp</span></a>
        </div>
        <div className="flex space-x-6">
          <a href="https://www.facebook.com/tanukurun" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500"><FaFacebookF size={30} /></a>
          <a href="https://twitter.com/tanukurun" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400"><FaTwitter size={30} /></a>
          <a href="https://instagram.com/tanukurun" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500"><FaInstagram size={30} /></a>
          <a href="https://youtube.com/tanukurun" target="_blank" rel="noopener noreferrer" className="hover:text-red-600"><FaYoutube size={30} /></a>
        </div>
      </footer>

      <style jsx>{`
        .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 15s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(100%);} 100% { transform: translateX(-100%);} }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
