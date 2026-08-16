// Translation system for English and Arabic
export const translations = {
  en: {
    // Navigation
    submitForm: "Submit Form",
    myForms: "My Forms",
    profile: "Profile",
    adminDashboard: "Admin Dashboard",
    
    // Header
    companyNameAr: "شركة اتجاهات النجاح للمقاولات",
    companyNameEn: "ETJAHAT AL NAJAH CONTRACTING CO.",
    vehicleHandoverSystem: "Vehicle Handover System",
    date: "Date",
    
    // Form Title
    formTitle: "VEHICLE HAND OVER TAKE OVER FORM",
    
    // Basic Information
    basicInformation: "Basic Information",
    handoverDate: "Handover Date",
    plateNo: "Plate No",
    vehicleType: "Vehicle Type",
    selectVehicleType: "Select vehicle type",
    handoverBy: "Handover By",
    takeoverBy: "Takeover By",
    
    // Vehicle Details
    vehicleDetails: "Vehicle Details",
    idNo: "ID No.",
    odoMeterReading: "ODO Meter Reading",
    registrationCard: "Registration Card",
    vehicleAuthorization: "Vehicle Authorization",
    yes: "Yes",
    no: "No",
    complete: "Complete",
    incomplete: "Incomplete",
    remarksForIncomplete: "Remarks for Incomplete",
    remarksPlaceholder: "Please specify the reason for incomplete authorization...",
    contactNo: "Contact No.",
    
    // Images
    images: "Images",
    vehiclePictures: "Vehicle Pictures",
    accessoriesPictures: "Accessories Pictures",
    addPhotos: "Add Photos",
    noPhotosUploaded: "No photos uploaded yet",
    clickToUpload: "Click \"Add Photos\" to upload images",
    
    // Signatures
    signatures: "Signatures",
    handoverSignature: "Handover Signature",
    takeoverSignature: "Takeover Signature",
    clear: "Clear",
    signHere: "Sign here",
    
    // Buttons
    submit: "Submit Form",
    submitting: "Submitting...",
    signOut: "Sign Out",
    
    // Profile
    profileSettings: "Profile Settings",
    personalInformation: "Personal Information",
    name: "Name",
    email: "Email",
    role: "Role",
    designation: "Designation",
    language: "Language",
    selectLanguage: "Select Language",
    english: "English",
    arabic: "العربية",
    saveChanges: "Save Changes",
    
    // Messages
    formSubmittedSuccess: "Form submitted successfully!",
    errorSubmittingForm: "Error submitting form",
    accessDenied: "Access Denied: Only administrators can access the admin dashboard.",
    maxFilesAllowed: "Maximum {count} files allowed for {type} pictures",
    loading: "Loading...",
    
    // Common
    required: "*",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    search: "Search",
    filter: "Filter",
    export: "Export",
    print: "Print"
  },
  
  ar: {
    // Navigation
    submitForm: "إرسال النموذج",
    myForms: "نماذجي",
    profile: "الملف الشخصي",
    adminDashboard: "لوحة الإدارة",
    
    // Header
    companyNameAr: "شركة اتجاهات النجاح للمقاولات",
    companyNameEn: "ETJAHAT AL NAJAH CONTRACTING CO.",
    vehicleHandoverSystem: "نظام تسليم المركبات",
    date: "التاريخ",
    
    // Form Title
    formTitle: "نموذج تسليم واستلام المركبة",
    
    // Basic Information
    basicInformation: "المعلومات الأساسية",
    handoverDate: "تاريخ التسليم",
    plateNo: "رقم اللوحة",
    vehicleType: "نوع المركبة",
    selectVehicleType: "اختر نوع المركبة",
    handoverBy: "المسلم",
    takeoverBy: "المستلم",
    
    // Vehicle Details
    vehicleDetails: "تفاصيل المركبة",
    idNo: "رقم الهوية",
    odoMeterReading: "قراءة العداد",
    registrationCard: "بطاقة التسجيل",
    vehicleAuthorization: "ترخيص المركبة",
    yes: "نعم",
    no: "لا",
    complete: "مكتمل",
    incomplete: "غير مكتمل",
    remarksForIncomplete: "ملاحظات للغير مكتمل",
    remarksPlaceholder: "يرجى تحديد سبب عدم اكتمال الترخيص...",
    contactNo: "رقم الاتصال",
    
    // Images
    images: "الصور",
    vehiclePictures: "صور المركبة",
    accessoriesPictures: "صور الملحقات",
    addPhotos: "إضافة صور",
    noPhotosUploaded: "لم يتم رفع صور بعد",
    clickToUpload: "انقر على \"إضافة صور\" لرفع الصور",
    
    // Signatures
    signatures: "التوقيعات",
    handoverSignature: "توقيع المسلم",
    takeoverSignature: "توقيع المستلم",
    clear: "مسح",
    signHere: "وقع هنا",
    
    // Buttons
    submit: "إرسال النموذج",
    submitting: "جاري الإرسال...",
    signOut: "تسجيل الخروج",
    
    // Profile
    profileSettings: "إعدادات الملف الشخصي",
    personalInformation: "المعلومات الشخصية",
    name: "الاسم",
    email: "البريد الإلكتروني",
    role: "الدور",
    designation: "المسمى الوظيفي",
    language: "اللغة",
    selectLanguage: "اختر اللغة",
    english: "English",
    arabic: "العربية",
    saveChanges: "حفظ التغييرات",
    
    // Messages
    formSubmittedSuccess: "تم إرسال النموذج بنجاح!",
    errorSubmittingForm: "خطأ في إرسال النموذج",
    accessDenied: "الوصول مرفوض: يمكن للمديرين فقط الوصول إلى لوحة الإدارة.",
    maxFilesAllowed: "الحد الأقصى {count} ملفات مسموح لصور {type}",
    loading: "جاري التحميل...",
    
    // Common
    required: "*",
    cancel: "إلغاء",
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    print: "طباعة"
  }
};

export const getTranslation = (key, language = 'en', params = {}) => {
  let translation = translations[language]?.[key] || translations.en[key] || key;
  
  // Replace parameters in translation
  Object.keys(params).forEach(param => {
    translation = translation.replace(`{${param}}`, params[param]);
  });
  
  return translation;
};