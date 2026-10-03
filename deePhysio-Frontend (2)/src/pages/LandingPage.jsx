import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchApi } from '../config/api';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaGlobe, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { 
  FiActivity, 
  FiCalendar, 
  FiCreditCard, 
  FiSmartphone, 
  FiFileText, 
  FiUsers,
  FiCheckCircle,
  FiTrendingUp,
  FiClock,
  FiShield,
  FiArrowRight,
  FiChevronDown,
  FiMail,
  FiSettings,
  FiDatabase,
  FiPieChart,
  FiLayout,
  FiBox,
  FiFolder,
  FiHeart,
  FiUserCheck
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const [clinicProfile, setClinicProfile] = useState({
    clinicName: 'Healthcare Clinic',
    logoDataUrl: ''
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetchApi('/public/config');
        if (res && res.ok) {
          const json = await res.json();
          if (json.data?.clinicProfile) {
            setClinicProfile(json.data.clinicProfile);
          }
        }
      } catch (e) {}
    };
    fetchBranding();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
  };

  const scaleUp = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
                className="w-11 h-11 rounded-full bg-slate-950 p-1 border-2 border-slate-700 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden"
              >
                <img 
                  src={clinicProfile.logoDataUrl || "/logo.png"} 
                  alt="KT Logo" 
                  className="w-full h-full object-contain" 
                />
              </motion.div>
              <span className="font-black text-lg tracking-tight text-slate-800 leading-none">Healthcare<br/><span className="text-clinicPrimary text-sm">Clinic</span></span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-slate-600 hover:text-clinicPrimary transition-colors text-sm font-bold">Features</a>
              <a href="#benefits" onClick={(e) => handleSmoothScroll(e, 'benefits')} className="text-slate-600 hover:text-clinicPrimary transition-colors text-sm font-bold">Benefits</a>
              <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, 'testimonials')} className="text-slate-600 hover:text-clinicPrimary transition-colors text-sm font-bold">Testimonials</a>
              <a href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className="text-slate-600 hover:text-clinicPrimary transition-colors text-sm font-bold">Pricing</a>
              <a href="/login" className="text-slate-600 hover:text-clinicPrimary transition-colors text-sm font-bold">Admin Login</a>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 text-sm whitespace-nowrap"
              >
                Start Free Trial
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-clinicPrimary/10 rounded-full blur-[120px] pointer-events-none"
        ></motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-clinicSecondary/10 rounded-full blur-[120px] pointer-events-none"
        ></motion.div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              className="lg:w-1/2"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/5 border border-slate-200 mb-6 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-slate-950 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img 
                    src={clinicProfile.logoDataUrl || "/logo.png"} 
                    alt="KT Logo" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Healthcare Management Platform</span>
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                Transform Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
                  Medical Practice
                </span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-slate-600 text-lg mb-8 max-w-xl font-medium">
                The secure, cloud-based SaaS platform built to help you scale. Manage patients, automate scheduling, and boost clinical efficiency from day one.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-wrap gap-4 mb-8">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 flex items-center gap-2"
                >
                  Start Free Trial <FiActivity />
                </motion.button>
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="#pricing"
                  className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-8 py-3.5 rounded-full font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  View Pricing
                </motion.a>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-700 mb-10">
                <div className="flex items-center gap-2"><FiCheckCircle className="text-clinicPrimary text-lg" /> 7-Day Free Trial</div>
                <div className="flex items-center gap-2"><FiCheckCircle className="text-clinicPrimary text-lg" /> No Credit Card</div>
                <div className="flex items-center gap-2"><FiCheckCircle className="text-clinicPrimary text-lg" /> Secure Cloud</div>
              </motion.div>
              
              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-8 mb-10">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-800 mb-1">500+</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Clinics</span>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-800 mb-1">50k+</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Patients</span>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-800 mb-1">99.9%</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Uptime</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="lg:w-1/2 w-full flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 50 }}
            >
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-500/20 group border-4 border-white max-w-[90%] lg:max-w-[480px]"
              >
                <img 
                  src="/hero-interaction.png" 
                  alt="Doctor and Patient Interaction" 
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105 "
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-sm font-black tracking-widest text-clinicPrimary uppercase mb-3">SaaS Modules</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Everything You Need to <br/>Manage Your Clinic</h3>
            <p className="text-slate-600 text-lg font-medium">Powerful, cloud-based modules built for scalability, strict data isolation, and efficient clinic administration.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: FiUsers, title: 'Patient Management', desc: 'Maintain secure digital health records, reducing paperwork and improving patient care.' },
              { icon: FiCalendar, title: 'Smart Scheduler', desc: 'Schedule appointments with automated reminders and drastically reduce no-shows.' },
              { icon: FiFileText, title: 'Clinical Notes', desc: 'Document patient visits faster using customizable templates to save hours of admin work.' },
              { icon: FiCreditCard, title: 'Billing & Invoices', desc: 'Generate invoices, track payments and manage clinic revenue effortlessly.' },
              { icon: FiPieChart, title: 'Analytics', desc: 'Gain real-time insights into clinic revenue, staff productivity, and growth metrics.' },
              { icon: FiShield, title: 'Role Permissions', desc: 'Control exactly what your receptionists, therapists, and billers can see with strict RBAC.' }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={scaleUp}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-clinicPrimary mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white transition-all duration-300">
                  <feature.icon className="text-2xl" />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-3">{feature.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 relative overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-clinicSecondary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="lg:w-1/2"
            >
              <motion.h2 variants={fadeIn} className="text-sm font-black tracking-widest text-clinicSecondary uppercase mb-3">Enterprise SaaS</motion.h2>
              <motion.h3 variants={fadeIn} className="text-4xl md:text-5xl font-black text-slate-900 mb-8">Why our <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Platform</span> Stands Out</motion.h3>
              <motion.p variants={fadeIn} className="text-slate-600 text-lg mb-8 font-medium">
                Our secure cloud architecture ensures your clinic operates efficiently, with strict tenant data isolation and powerful role-based permissions.
              </motion.p>
              
              <ul className="space-y-4 mb-10">
                {[
                  'Multi Tenant (Every clinic isolated securely)',
                  'Role Based Access (Granular permissions)',
                  'Secure Data (HIPAA-grade cloud storage)',
                  'Cloud Based (Zero installation required)'
                ].map((item, i) => (
                  <motion.li variants={fadeIn} key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                    <motion.div whileHover={{ scale: 1.2, rotate: 15 }}><FiCheckCircle className="text-clinicPrimary flex-shrink-0 text-xl" /></motion.div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <div className="lg:w-1/2 w-full grid grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6 pt-12"
              >
                <div className="p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-full bg-clinicSecondary/10 flex items-center justify-center text-clinicSecondary mb-4"><FiTrendingUp className="text-2xl" /></div>
                  <h4 className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">40%</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Less Admin Work</p>
                </div>
                <div className="p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4"><FiShield className="text-2xl" /></div>
                  <h4 className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">99.9%</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Uptime</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                <div className="p-8 rounded-3xl bg-gradient-to-b from-white to-emerald-50 shadow-xl shadow-emerald-500/10 flex flex-col items-center text-center border border-emerald-100 hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-full bg-clinicPrimary/10 flex items-center justify-center text-clinicPrimary mb-4"><FiClock className="text-2xl" /></div>
                  <h4 className="text-3xl lg:text-4xl font-black text-clinicPrimary mb-1">15+</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hours Saved</p>
                </div>
                <div className="p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-4"><FiDatabase className="text-2xl" /></div>
                  <h4 className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">Cloud</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secure Backup</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-sm font-black tracking-widest text-clinicPrimary uppercase mb-3">Client Success</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">What Our Clinics Say</h3>
            <p className="text-slate-600 text-lg font-medium">Join thousands of satisfied clinics leveraging our Multi-Tenant SaaS platform.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { name: "Dr. Sarah Jenkins", role: "Clinic Admin", quote: "The 7-day free trial proved how powerful the cloud software is. We registered, activated instantly, and our entire team was onboarded the same day!" },
              { name: "Michael Chang", role: "Clinic Owner", quote: "The Role-Based Access makes managing my receptionists and therapists secure. Patient data is isolated, and I can see reports anywhere from the cloud." },
              { name: "Emily Roberts", role: "Lead Physiotherapist", quote: "No credit card required to start, which showed their confidence. Now, the automated scheduling and SOAP notes save our staff 15+ hours weekly." }
            ].map((review, idx) => (
              <motion.div 
                variants={scaleUp}
                key={idx} 
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="text-amber-400 mb-6 text-2xl tracking-widest flex gap-1">
                    {[...Array(5)].map((_, i) => <motion.span key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay: i*0.1}}>★</motion.span>)}
                  </div>
                  <p className="text-slate-700 font-medium italic mb-8 leading-relaxed">"{review.quote}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-white shadow-md">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900">{review.name}</h5>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-0.5">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-sm font-black tracking-widest text-emerald-400 uppercase mb-3">Simple Pricing</h2>
            <h3 className="text-3xl md:text-5xl font-black text-white mb-6">Subscription Plans</h3>
            <p className="text-slate-400 text-lg font-medium">Start your 7-Day Free Trial. No Credit Card required.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1400px] mx-auto"
          >
            {[
              { name: '7-Day Free Trial', price: '₹0', period: 'per week', features: ['7 Days full feature trial access', 'Duration: 7 Days'], button: 'Get Started', bg: 'bg-slate-800' },
              { name: 'Starter', price: '₹999', period: 'per month', features: ['Essential clinic management features', 'Duration: Monthly'], button: 'Get Started', bg: 'bg-slate-800' },
              { name: 'Standard', price: '₹1,299', period: 'per month', features: ['Complete features for growing clinics', 'Duration: Monthly'], button: 'Get Started', bg: 'bg-white', border: 'border-white', badge: 'Most Popular', text: 'text-slate-900', priceColor: 'text-slate-900', featureColor: 'text-slate-700', scale: true },
              { name: 'Pro', price: '₹1,499', period: 'per month', features: ['Kiaan AI Assistant & AI Features', 'Advanced features and priority support', 'Duration: Monthly'], button: 'Get Started', bg: 'bg-slate-800' },
              { name: 'Custom Plan', price: 'Custom', period: 'Tailored to your clinic', features: ['SaaS with customization', 'Personal domain', 'Personal branding', 'AI and automation'], button: 'Get Started', bg: 'bg-slate-800' }
            ].map((plan, idx) => (
              <motion.div 
                variants={scaleUp}
                whileHover={{ y: -15, transition: { duration: 0.3 } }}
                key={idx} 
                className={`relative p-8 rounded-[2rem] ${plan.bg} border ${plan.border || 'border-slate-700'} flex flex-col shadow-2xl ${plan.scale ? 'lg:scale-105 z-10' : ''}`}
              >
                {plan.badge && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-lg">{plan.badge}</div>}
                <h4 className={`text-xl font-black mb-2 ${plan.text || 'text-white'}`}>{plan.name}</h4>
                <div className="mb-6 flex flex-col gap-1">
                  <span className={`text-3xl lg:text-4xl font-black tracking-tight ${plan.priceColor || 'text-white'}`}>{plan.price}</span>
                  <span className={`text-xs font-bold ${plan.featureColor || 'text-slate-400'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-3 text-sm font-bold ${plan.featureColor || 'text-slate-300'}`}>
                      <FiCheckCircle className="text-emerald-500 flex-shrink-0 text-lg mt-0.5" /> <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigate(`/register?plan=${encodeURIComponent(plan.name)}`)} 
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-xl ${plan.badge ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-[1.02]' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                >
                  {plan.button}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center relative overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[50%] -right-[10%] w-[100vw] h-[100vw] bg-white/5 rounded-full blur-[100px] pointer-events-none"
        ></motion.div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight"
          >
            Transform Your Clinic Today
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg lg:text-xl font-bold mb-10 max-w-2xl mx-auto"
          >
            Join thousands of clinic owners who have already streamlined their operations with our Healthcare Management Platform.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="bg-white text-emerald-600 hover:bg-slate-50 px-10 py-5 rounded-full font-black text-lg transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 mx-auto"
          >
            Start Your 7-Day Free Trial <FiArrowRight />
          </motion.button>
        </div>
      </section>

      {/* Comprehensive Dark Footer */}
      <footer className="bg-[#0f1115] text-slate-300 py-16 border-t border-slate-800 font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
            
            {/* Column 1: Brand & Social */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-900 p-1 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img 
                    src={clinicProfile.logoDataUrl || "/logo.png"} 
                    alt="KT Logo" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div className="font-black text-xl tracking-tight text-white flex items-center gap-2">
                   <span>KIAAN <span className="text-teal-400">TECHNOLOGY</span></span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium pr-4">
                The ultimate management solution for modern medical clinics, physiotherapy centers, and healthcare providers.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a href="https://www.instagram.com/kiaan_technology4/" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg">
                  <FaInstagram size={16} />
                </a>
                <a href="#" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg">
                  <FaFacebookF size={16} />
                </a>
                <a href="https://www.linkedin.com/company/kiaan-technology-pvt-ltd/posts/?feedView=all" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-[#0A66C2] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg">
                  <FaLinkedinIn size={15} />
                </a>
                <a href="https://kiaantechnology.com/" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg">
                  <FaGlobe size={16} />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-6 lg:pl-8">
              <h4 className="text-white font-bold text-lg">Quick Links</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
                <li><a href="#pricing" className="hover:text-teal-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Column 3: Software Modules */}
            <div className="space-y-6">
              <h4 className="text-white font-bold text-lg">Software Modules</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Patient Medical Records</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Appointment Scheduling</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Pharmacy & Inventory</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Billing & POS Invoicing</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Telehealth & Encounters</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Reports & Analytics</a></li>
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div className="space-y-6">
              <h4 className="text-white font-bold text-lg">Contact Us</h4>
              <ul className="space-y-5 text-sm font-medium">
                <li className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-teal-500 mt-1 flex-shrink-0" size={16} />
                  <span className="leading-relaxed">2341, Sector E, Sudama Nagar, Indore,<br/>Madhya Pradesh 452009</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaPhoneAlt className="text-teal-500 flex-shrink-0" size={16} />
                  <a href="tel:+919752100980" className="hover:text-teal-400 transition-colors">+91 97521 00980</a>
                </li>
                <li className="flex items-center gap-3">
                  <FaEnvelope className="text-teal-500 flex-shrink-0" size={16} />
                  <a href="mailto:info@kiaantechnology.com" className="hover:text-teal-400 transition-colors">info@kiaantechnology.com</a>
                </li>
              </ul>
            </div>

          </div>

          {/* Footer Bottom */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500">
            <p>© {new Date().getFullYear()} Kiaan Tech Craft. All rights reserved. Powered by <a href="https://kiaantechnology.com/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-teal-400">Kiaan Technology</a>.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-teal-400 transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-teal-400 transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
