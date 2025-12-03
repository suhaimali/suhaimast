import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  Dimensions, StatusBar, FlatList, Image, Platform, Alert,
  LayoutAnimation, UIManager, Modal, SafeAreaView, Linking, ActivityIndicator, Share
} from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

// --- CONFIGURATION ---
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const DOCTOR_PHONE = '9895353078';
const DOCTOR_WHATSAPP_NO = '919895353078';
const DOCTOR_NAME = 'Dr. Mansoor';
const CLINIC_ADDRESS = '123 Health St, Wellness City, 12345';
const EMERGENCY_CONTACT = '112';

// --- CRASH FIX: Safe LayoutAnimation for Android ---
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// --- COLORS ---
const Colors = {
  bg: '#F3F4F6',
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  card: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  action: '#14B8A6',
  danger: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  whatsapp: '#22C55E',
  dash1: '#6366F1',
  dash2: '#0EA5E9',
  dash3: '#F97316',
  dash4: '#EC4899',
  dash5: '#8B5CF6',
  dash6: '#22C55E',
  inputBg: '#F9FAFB', // New for Rx Form
  borderColor: '#D1D5DB' // New for Rx Form
};

// --- SCREENS DEFINITION ---
const Screens = {
  LOGIN: 'Login', DASHBOARD: 'Dashboard', PATIENT_LIST: 'PatientList',
  ADD_PATIENT: 'AddPatient', PATIENT_DETAILS: 'PatientDetails', INVENTORY: 'Inventory',
  LAB_LIST: 'LabList', ADD_LAB: 'AddLab', RX_HISTORY: 'RxHistory', ADD_RX: 'AddRx',
  TEMPLATE_MANAGER: 'TemplateManager', ADD_TEMPLATE: 'AddTemplate',
  PROCEDURES_HISTORY: 'ProceduresHistory', ADD_PROCEDURE: 'AddProcedure',
  ALL_RX_HISTORY: 'AllRxHistory',
};

// --- DUMMY DATA ---
const INITIAL_PATIENTS = [
  { id: '1', name: 'Alice Johnson', age: '29', gender: 'Female', phone: '9876543210', blood: 'O+', image: 'https://randomuser.me/api/portraits/women/44.jpg', vitals: { bp: '118/75', hr: '70', temp: '98.4', spo2: '99', weight: '65' } },
  { id: '2', name: 'Robert Smith', age: '54', gender: 'Male', phone: '9123456789', blood: 'A-', image: 'https://randomuser.me/api/portraits/men/32.jpg', vitals: { bp: '140/90', hr: '80', temp: '99.1', spo2: '97', weight: '85' } },
  { id: '3', name: 'Charlie Brown', age: '35', gender: 'Male', phone: '9998887770', blood: 'B+', image: 'https://randomuser.me/api/portraits/men/1.jpg', vitals: { bp: '120/80', hr: '75', temp: '98.6', spo2: '98', weight: '70' } },
];
const INITIAL_LABS = [{ id: 'L1', patientId: '1', patientName: 'Alice Johnson', testName: 'Complete Blood Count', date: '2023-11-15', image: null, labNote: 'Hb: 14.5 g/dL (Normal)', result: 'Normal' },];
const INITIAL_INVENTORY = [
  { id: '101', name: 'Paracetamol', strength: '500mg', dosage: 'Tablet', stock: 120, status: 'Good' },
  { id: '102', name: 'Amoxicillin', strength: '250mg/5ml', dosage: 'Syrup', stock: 4, status: 'Critical' },
  { id: '103', name: 'N95 Masks', strength: 'N/A', dosage: 'Piece', stock: 45, status: 'Good' },
  { id: '104', name: 'Cetirizine', strength: '10mg', dosage: 'Tablet', stock: 50, status: 'Good' },
];
const INITIAL_APPOINTMENTS = [
  { id: 'a1', time: '09:00 AM', patientName: 'Alice Johnson', type: 'Routine Checkup', reason: 'Headache', status: 'Pending' },
  { id: 'a2', time: '10:30 AM', patientName: 'Charlie Brown', type: 'Follow Up', reason: 'Review blood work', status: 'Pending' },
];
const INITIAL_PRESCRIPTIONS = [];
const INITIAL_TEMPLATES = [
  { id: 'template-none', name: 'None', diagnosis: '', medicines: [] },
  { id: 'template-cold', name: 'Cold', diagnosis: 'Common Cold', medicines: [{ id: 'tm1', name: 'Cetirizine', strength: '10mg', dosage: 'Tablet', frequency: 'OD', duration: '5 Days', instructions: 'At night' }] },
];
const INITIAL_PROCEDURES = [
  { id: 'p1', patientId: '1', patientName: 'Alice Johnson', procedureName: 'Wound Dressing', date: '2023-11-20', cost: '500', notes: 'Minor scrape.' },
];
const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
const FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QID', 'PRN', 'SOS'];
const DURATION_OPTIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '1 Month', 'As needed'];
const VITAL_KEYS = { SpO2: 'spo2', BP: 'bp', HR: 'hr', Temp: 'temp', Weight: 'weight' };

// --- UTILITY COMPONENTS ---

const LoadingOverlay = ({ visible }) => (
  <Modal transparent={true} animationType="fade" visible={visible}>
    <View style={styles.loaderOverlay}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    </View>
  </Modal>
);

const Header = ({ title, onBack, onAdd, onMenu }) => (
  <View style={styles.header}>
    {onBack ? <TouchableOpacity onPress={onBack}><MaterialIcons name="arrow-back-ios" size={24} color="#FFF" /></TouchableOpacity> : (onMenu ? <TouchableOpacity onPress={onMenu}><MaterialIcons name="sort" size={30} color="#FFF" /></TouchableOpacity> : null)}
    <Text style={styles.headerTitle}>{title}</Text>
    {onAdd ? <TouchableOpacity onPress={onAdd}><MaterialIcons name="add" size={32} color="#FFF" /></TouchableOpacity> : <View style={{ width: 32 }} />}
  </View>
);
const DashboardCard = ({ title, count, icon, color, onPress }) => (
  <TouchableOpacity style={styles.gridCard} onPress={onPress}>
    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}><FontAwesome5 name={icon} size={24} color={color} /></View>
    <Text style={styles.gridCount}>{String(count)}</Text>
    <Text style={styles.gridTitle}>{title}</Text>
  </TouchableOpacity>
);
const VitalBox = ({ label, val, unit, icon, color }) => (
  <View style={[styles.vitalCard, { borderTopColor: color }]}>
    <FontAwesome5 name={icon} size={20} color={color} />
    <Text style={styles.vitalVal}>{val || 'N/A'} <Text style={{ fontSize: 12, color: Colors.subText }}>{val ? unit : ''}</Text></Text>
    <Text style={styles.vitalLabel}>{label}</Text>
  </View>
);
// Standard Input used in Old Screens
const Input = ({ label, value, onChange, style, kbd, placeholder, multiline }) => (
  <View style={[{ marginBottom: 15 }, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.inputBox, multiline && { height: style?.height || 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} keyboardType={kbd || 'default'} placeholder={placeholder} multiline={multiline} placeholderTextColor="#9CA3AF" />
  </View>
);
const DrawerItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
    <FontAwesome5 name={icon} size={20} color={color} style={{ width: 40 }} />
    <Text style={[styles.drawerLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);
const DetailPill = ({ label, value, unit, color }) => (
  <View style={{ flexDirection: 'row', backgroundColor: color + '15', padding: 8, borderRadius: 10, margin: 3, flexBasis: '47%', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 12, color: color, fontWeight: 'bold' }}>{label}: </Text>
    <Text style={{ fontSize: 14, color: Colors.text }}>{value} <Text style={{ fontSize: 10, color: Colors.subText }}>{value !== 'N/A' ? unit : ''}</Text></Text>
  </View>
);

// --- SCREEN COMPONENTS ---

const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState('1'); const [pass, setPass] = useState('1');
  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginCard}>
        <View style={styles.logoBubble}><FontAwesome5 name="hospital-user" size={40} color="#FFF" /></View>
        <Text style={styles.loginTitle}>Dr Login.</Text>
        <Text style={styles.loginSub}>Clinic Management</Text>
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="user" size={16} color={Colors.subText} style={{ marginRight: 10 }} />
          <TextInput placeholder="Username" style={{ flex: 1, paddingVertical: 5 }} value={user} onChangeText={setUser} autoCapitalize="none" />
        </View>
        <View style={styles.loginInputContainer}>
          <FontAwesome5 name="lock" size={16} color={Colors.subText} style={{ marginRight: 10 }} />
          <TextInput placeholder="Password" style={{ flex: 1, paddingVertical: 5 }} value={pass} onChangeText={setPass} secureTextEntry={true} />
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={() => onLogin(user, pass)}>
          <Text style={styles.btnText}>LOGIN</Text>
        </TouchableOpacity>
        <Text style={{ marginTop: 15, color: Colors.subText, fontSize: 12 }}>Default: 1 / 1</Text>
      </View>
    </View>
  );
};

const Dashboard = ({ patients, appointments, inventory = [], templates = [], procedures, prescriptions, navigate, openDrawer, onDeleteAppt }) => {
  const lowStock = inventory.filter(i => i.status !== 'Good');
  
  const EmergencyContactWidget = () => (
    <View style={styles.emergencyCard}>
      <FontAwesome5 name="first-aid" size={24} color={Colors.danger} />
      <View style={{ flex: 1, marginHorizontal: 15 }}>
        <Text style={styles.emergencyTitle}>Emergency Contact</Text>
        <Text style={styles.emergencyNumber}>{EMERGENCY_CONTACT}</Text>
      </View>
      <TouchableOpacity style={styles.callNowBtn} onPress={() => Linking.openURL(`tel:${EMERGENCY_CONTACT}`)}>
        <Text style={styles.callNowText}>CALL NOW</Text>
      </TouchableOpacity>
    </View>
  );
  return (
    <View style={styles.screenContainer}>
      <Header title="Dashboard" onMenu={openDrawer} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <View style={styles.welcomeBanner}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.docName}>{DOCTOR_NAME}</Text>
          </View>
          <FontAwesome5 name="user-md" size={35} color="#FFF" opacity={0.8} />
        </View>
        <View style={styles.gridContainer}>
          <DashboardCard title="Patients" count={patients.length} icon="users" color={Colors.dash1} onPress={() => navigate(Screens.PATIENT_LIST)} />
          <DashboardCard title="Reports" count="View" icon="flask" color={Colors.dash2} onPress={() => navigate(Screens.LAB_LIST)} />
          <DashboardCard title="Medicine" count={inventory.length} icon="capsules" color={Colors.dash3} onPress={() => navigate(Screens.INVENTORY)} />
          <DashboardCard title="Schedule" count={appointments.length} icon="calendar-alt" color={Colors.dash4} onPress={() => { }} />
          <DashboardCard title="Templates" count={Math.max(0, templates.length - 1)} icon="file-signature" color={Colors.dash5} onPress={() => navigate(Screens.TEMPLATE_MANAGER)} />
          <DashboardCard title="Procedures" count={procedures.length} icon="stethoscope" color={Colors.dash6} onPress={() => navigate(Screens.PROCEDURES_HISTORY)} />
        </View>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        {appointments.length === 0 ? (
          <Text style={{ color: Colors.subText, fontStyle: 'italic' }}>No appointments scheduled.</Text>
        ) : (
          appointments.map(a => (
            <View key={a.id} style={styles.apptCard}>
              <View style={styles.timeBox}><Text style={styles.timeText}>{a.time}</Text></View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.apptName}>{a.patientName}</Text>
                <Text style={styles.apptType}>{a.type} - {a.reason}</Text>
              </View>
              <TouchableOpacity onPress={() => onDeleteAppt(a.id)} style={{ backgroundColor: Colors.success + '20', padding: 8, borderRadius: 10 }}>
                <FontAwesome5 name="check" size={18} color={Colors.success} />
              </TouchableOpacity>
            </View>
          ))
        )}
        {lowStock.length > 0 ? (
          <View style={[styles.alertWidget, { marginTop: 20 }]}>
            <View style={styles.alertHeader}><MaterialIcons name="warning" size={24} color={Colors.danger} /><Text style={styles.alertTitle}>Stock Alert</Text></View>
            {lowStock.slice(0, 2).map(item => (
              <View key={item.id} style={styles.alertItem}>
                <Text style={styles.alertName}>{item.name}</Text>
                <Text style={[styles.alertStatus, { color: Colors.danger }]}>{item.stock} Left</Text>
              </View>
            ))}
            {lowStock.length > 2 ? <Text style={{ fontSize: 12, color: Colors.subText, textAlign: 'right' }}>...and {lowStock.length - 2} more</Text> : null}
          </View>
        ) : null}
        <EmergencyContactWidget />
      </ScrollView>
    </View>
  );
};

const PatientList = ({ patients, navigate, onDelete, onEdit, onBook }) => {
  const [search, setSearch] = useState(''); const [bookModal, setBookModal] = useState(null); const [apptTime, setApptTime] = useState('09:00 AM'); const [apptReason, setApptReason] = useState(''); const [isFollowUp, setIsFollowUp] = useState(false); const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <View style={styles.screenContainer}>
      <Header title="Patients" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_PATIENT)} />
      <View style={styles.searchContainer}><Ionicons name="search" size={20} color={Colors.subText} /><TextInput style={styles.searchInput} placeholder="Search Patient..." value={search} onChangeText={setSearch} /></View>
      <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (
        <View key={item.id} style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigate(Screens.PATIENT_DETAILS, item)}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/50' }} style={styles.listAvatar} />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>{item.gender}, {item.age} yrs</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => setBookModal(item)} style={styles.actionLabelBtn}><FontAwesome5 name="calendar-plus" size={14} color={Colors.primary} /><Text style={styles.actionLabelText}>Book</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10 }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity>
          </View>
        </View>
      )} />
      <Modal visible={!!bookModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <Text style={{ textAlign: 'center', color: Colors.primary, marginBottom: 15, fontWeight: 'bold' }}>{bookModal?.name}</Text>
            <View style={styles.timeGrid}>{TIME_SLOTS.slice(0, 6).map(t => (
              <TouchableOpacity key={t} style={[styles.timeSlot, apptTime === t && styles.activeTimeSlot]} onPress={() => setApptTime(t)}>
                <Text style={[styles.timeSlotText, apptTime === t && { color: '#FFF' }]}>{t}</Text>
              </TouchableOpacity>
            ))}</View>
            <Input label="Reason" value={apptReason} onChange={setApptReason} />
            <TouchableOpacity style={[styles.row, { marginBottom: 20 }]} onPress={() => setIsFollowUp(!isFollowUp)}><FontAwesome5 name={isFollowUp ? "check-square" : "square"} size={20} color={Colors.primary} /><Text style={{ marginLeft: 10, color: Colors.text }}>Follow Up?</Text></TouchableOpacity>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: Colors.subText, marginRight: 10 }]} onPress={() => setBookModal(null)}><Text style={styles.btnText}>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={() => { onBook(bookModal, apptTime, apptReason, isFollowUp ? 'Follow Up' : 'Consultation'); setBookModal(null); }}><Text style={styles.btnText}>CONFIRM</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const PatientDetails = ({ patient, labs, navigate }) => {
  const idCardRef = useRef(null);
  if (!patient) return null;
  const handleShareID = async () => { 
      try {
        const uri = await idCardRef.current.capture();
        await Sharing.shareAsync(uri);
      } catch(e) { Alert.alert("Error", "Sharing not supported"); }
  };

  return (
    <View style={styles.screenContainer}>
      <Header title="Patient Profile" onBack={() => navigate(Screens.PATIENT_LIST)} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ViewShot ref={idCardRef} style={styles.idCard} options={{ format: 'png', quality: 0.9 }}>
          <View style={styles.idTop}>
            <Text style={styles.idTitle}>MEDICAL ID CARD</Text>
            <TouchableOpacity onPress={handleShareID}>
              <FontAwesome5 name="share-alt" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.idContent}>
            <Image source={{ uri: patient.image || 'https://via.placeholder.com/100' }} style={styles.idPhoto} />
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.idName}>{patient.name}</Text>
              <Text style={styles.idRow}><Text>ID: {patient.id}</Text></Text>
              <Text style={styles.idRow}><Text>{patient.gender}, {patient.age} Yrs</Text></Text>
              <Text style={styles.idRow}><Text>Ph: {patient.phone}</Text></Text>
              <Text style={styles.idRow}><Text>Blood: {patient.blood}</Text></Text>
            </View>
          </View>
        </ViewShot>
        <Text style={styles.sectionTitle}>Vitals</Text>
        <View style={styles.vitalGrid}>
          <VitalBox label="HR" val={patient.vitals.hr} unit="bpm" icon="heartbeat" color={Colors.danger} />
          <VitalBox label="BP" val={patient.vitals.bp} unit="" icon="tint" color={Colors.action} />
          <VitalBox label="Temp" val={patient.vitals.temp} unit="F" icon="thermometer-half" color={Colors.warning} />
        </View>
        <View style={[styles.vitalGrid, { marginTop: 10 }]}>
          <VitalBox label="SpO2" val={patient.vitals.spo2} unit="%" icon="lungs" color={Colors.success} />
          <VitalBox label="Weight" val={patient.vitals.weight} unit="kg" icon="weight" color={Colors.primary} />
          <TouchableOpacity style={[styles.vitalCard, { borderTopColor: Colors.dash4, justifyContent: 'center' }]} onPress={() => navigate(Screens.RX_HISTORY, patient)}>
            <FontAwesome5 name="prescription-bottle-alt" size={20} color={Colors.dash4} />
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.dash4, marginTop: 5 }}>Rx History</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Lab Reports</Text>
        <View style={{ backgroundColor: Colors.card, borderRadius: 15, padding: 15, elevation: 2 }}>
          {labs.filter(l => l.patientId === patient.id).length > 0 ? (
            labs.filter(l => l.patientId === patient.id).map(l => (
              <Text key={l.id} style={{ marginBottom: 5, color: Colors.text }}>{l.date} - {l.testName}</Text>
            ))
          ) : (
            <Text style={{ color: Colors.subText, fontStyle: 'italic' }}>No lab reports on file.</Text>
          )}
          <TouchableOpacity style={[styles.btnPrimary, { marginTop: 15, padding: 10 }]} onPress={() => navigate(Screens.ADD_LAB, { patientId: patient.id, patientName: patient.name })}>
            <Text style={[styles.btnText, { fontSize: 14 }]}>ADD NEW REPORT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const PatientForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { name: '', age: '', gender: 'Male', phone: '', blood: '', image: null, vitals: { bp: '', hr: '', temp: '', spo2: '', weight: '' } }); const [bookAppt, setBookAppt] = useState(false); const [apptTime, setApptTime] = useState('09:00 AM'); const [apptReason, setApptReason] = useState(''); const [isFollowUp, setIsFollowUp] = useState(false); const [showTimeModal, setShowTimeModal] = useState(false); const pickImage = async () => { let r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, allowsEditing: true }); if (!r.canceled) setForm({ ...form, image: r.assets[0].uri }); };
  return (
    <View style={styles.screenContainer}>
      <Header title={initialData ? "Edit Patient" : "Add New Patient"} onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity style={styles.uploadCircle} onPress={pickImage}>
          {form.image ? <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%', borderRadius: 50 }} /> : <FontAwesome5 name="camera" size={24} color={Colors.primary} />}
        </TouchableOpacity>
        <Input label="Full Name" value={form.name} onChange={t => setForm({ ...form, name: t })} />
        <View style={styles.row}>
          <Input style={{ flex: 1, marginRight: 10 }} label="Age" kbd="numeric" value={form.age} onChange={t => setForm({ ...form, age: t })} />
          <Input style={{ flex: 1 }} label="Blood Group" value={form.blood} onChange={t => setForm({ ...form, blood: t })} />
        </View>
        <Input label="Phone" kbd="phone-pad" value={form.phone} onChange={t => setForm({ ...form, phone: t })} />
        <Text style={styles.sectionTitle}>Vital Signs</Text>
        <View style={styles.vitalFormCard}>
          <View style={styles.row}>
            <Input style={{ flex: 1, marginRight: 10 }} label="SpO2 (%)" kbd="numeric" value={form.vitals.spo2} onChange={t => setForm({ ...form, vitals: { ...form.vitals, spo2: t } })} />
            <Input style={{ flex: 1 }} label="BP (mmHg)" value={form.vitals.bp} onChange={t => setForm({ ...form, vitals: { ...form.vitals, bp: t } })} />
          </View>
          <Input label="Weight (kg)" kbd="numeric" value={form.vitals.weight} onChange={t => setForm({ ...form, vitals: { ...form.vitals, weight: t } })} />
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(form, bookAppt ? { bookit: true, time: apptTime, type: isFollowUp ? 'Follow Up' : 'Consultation', reason: apptReason } : { bookit: false })}>
          <Text style={styles.btnText}>SAVE RECORD</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const LabList = ({ labs, navigate, onDelete, onEdit }) => {
  const [viewImage, setViewImage] = useState(null);
  return (
    <View style={styles.screenContainer}>
      <Header title="Lab Reports" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_LAB)} />
      <FlatList data={labs} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.labThumb} onPress={() => item.image && setViewImage(item.image)}>
              {item.image ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : <FontAwesome5 name="file-medical" size={24} color={Colors.primary} />}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.cardTitle}>{item.testName}</Text>
              <Text style={styles.cardSub}>{item.patientName}</Text>
              <Text style={styles.cardSub}>
                <FontAwesome5 name="clipboard-list" size={10} color={Colors.subText} /> <Text>{item.labNote}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => item.image ? setViewImage(item.image) : Alert.alert("No Proof", "No image uploaded")} style={styles.iconBtn}>
              <FontAwesome5 name="eye" size={14} color={Colors.action} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 5 }]}>
              <FontAwesome5 name="trash" size={14} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      )} />
      <Modal visible={!!viewImage} transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }} onPress={() => setViewImage(null)}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
          {viewImage && <Image source={{ uri: viewImage }} style={{ width: width, height: height * 0.8, resizeMode: 'contain' }} />}
        </View>
      </Modal>
    </View>
  );
};

const LabForm = ({ initialData, patients, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { patientId: patients[0]?.id, testName: '', date: new Date().toLocaleDateString(), image: null, labNote: '' }); 
  const pickProof = async () => { let r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 }); if (!r.canceled) setForm({ ...form, image: r.assets[0].uri }); };
  return (
    <View style={styles.screenContainer}>
      <Header title={initialData ? "Edit Report" : "Upload Report"} onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>Select Patient</Text>
        <View style={styles.inputBox}>
          <Picker selectedValue={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>
            {patients.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
          </Picker>
        </View>
        <Input label="Test Name" placeholder="e.g. Blood Test, USG KUB" value={form.testName} onChange={t => setForm({ ...form, testName: t })} />
        <Input label="Lab Note / Result Detail" placeholder="e.g. 220 mg/dL" value={form.labNote} onChange={t => setForm({ ...form, labNote: t })} />
        <Text style={styles.label}>Upload Proof (Image)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickProof}>
          {form.image ? <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : (
              <View style={{ alignItems: 'center' }}>
                <FontAwesome5 name="cloud-upload-alt" size={30} color={Colors.subText} />
                <Text style={{ color: Colors.subText, marginTop: 5 }}>Click to Upload</Text>
              </View>
            )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(form)}>
          <Text style={styles.btnText}>SAVE REPORT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const InventoryScreen = ({ inventory, onUpdateStock, onAddItem, onDeleteItem, onUpdateItem, navigate }) => {
  const [medName, setMedName] = useState(''); const [dosageForm, setDosageForm] = useState('Tablet'); const [strength, setStrength] = useState(''); const [isAdding, setIsAdding] = useState(false); const [editingItem, setEditingItem] = useState(null);
  const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Piece'];
  const handleAdd = () => { if (medName && strength) { onAddItem(medName, dosageForm, strength); setMedName(''); setStrength(''); setIsAdding(false); } else { Alert.alert("Missing Fields", "Please enter Medicine Name and Strength"); } };
  const EditInventoryModal = () => {
    const [form, setForm] = useState(editingItem);
    useEffect(() => { setForm(editingItem); }, [editingItem]);
    if (!form) return null;
    const handleSave = () => { onUpdateItem(form.id, { name: form.name, strength: form.strength, dosage: form.dosage }); setEditingItem(null); };
    return (
      <Modal visible={!!editingItem} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Medicine</Text>
            <Input label="Medicine Name" value={form.name} onChange={t => setForm({ ...form, name: t })} />
            <Input label="Strength" value={form.strength} onChange={t => setForm({ ...form, strength: t })} />
            <Text style={styles.label}>Dosage Form</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={form.dosage} onValueChange={v => setForm({ ...form, dosage: v })}>
                {DOSAGE_FORMS.map(f => <Picker.Item key={f} label={f} value={f} />)}
              </Picker>
            </View>
            <View style={[styles.row, { marginTop: 20 }]}>
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: Colors.subText, marginRight: 10 }]} onPress={() => setEditingItem(null)}>
                <Text style={styles.btnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handleSave}>
                <Text style={styles.btnText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  return (
    <View style={styles.screenContainer}>
      <Header title="Inventory" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => setIsAdding(!isAdding)} />
      <EditInventoryModal />
      {isAdding ? (
        <View style={styles.addItemBox}>
          <Text style={styles.subHeader}>Add New Medicine</Text>
          <Input label="Medicine Name" value={medName} onChange={setMedName} style={{ marginBottom: 10 }} />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Dosage Form</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={dosageForm} onValueChange={setDosageForm} style={{ height: 50 }}>
                  {DOSAGE_FORMS.map(f => <Picker.Item key={f} label={f} value={f} />)}
                </Picker>
              </View>
            </View>
            <Input style={{ flex: 1 }} label="Strength" value={strength} onChange={setStrength} />
          </View>
          <TouchableOpacity style={styles.btnSmall} onPress={handleAdd}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD MEDICINE</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <FlatList data={inventory} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (
        <View key={item.id} style={styles.invCard}>
          <View style={styles.invIconBox}><FontAwesome5 name="pills" size={20} color={Colors.primary} /></View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.invName}>{item.name} <Text style={styles.invStrength}>{item.strength}</Text></Text>
            <Text style={styles.invUnit}>{item.dosage}</Text>
            <Text style={[styles.stockStatus, { color: item.stock < 10 ? Colors.danger : Colors.success }]}>
              {item.stock === 0 ? 'Out of Stock' : `${item.stock} in stock`}
            </Text>
          </View>
          <View style={styles.counterContainer}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => onUpdateStock(item.id, -1)}>
              <Entypo name="minus" size={24} color={Colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.counterBtn} onPress={() => onUpdateStock(item.id, 1)}>
              <Entypo name="plus" size={24} color={Colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.action + '20' }]} onPress={() => setEditingItem(item)}>
              <FontAwesome5 name="pen" size={14} color={Colors.action} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]} onPress={() => onDeleteItem(item.id)}>
              <FontAwesome5 name="trash-alt" size={14} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      )} />
    </View>
  );
};

const TemplateManagerScreen = ({ templates, navigate, onEdit, onDelete }) => {
  return (
    <View style={styles.screenContainer}>
      <Header title="Manage Rx Templates" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_TEMPLATE)} />
      <FlatList data={templates.filter(t => t.id !== 'template-none')} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.invIconBox, { backgroundColor: Colors.dash5 + '20' }]}>
              <FontAwesome5 name="file-signature" size={20} color={Colors.dash5} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.invName}>{item.name}</Text>
              <Text style={styles.cardSub}>{item.medicines.length} medicine(s)</Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity>
            </View>
          </View>
        </View>
      )} ListEmptyComponent={<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No custom templates found. Tap '+' to add one.</Text></View>} />
    </View>
  );
};

const AddTemplateForm = ({ initialData, inventory, onSave, onCancel }) => {
  const isEdit = !!initialData; const medicineNames = [...new Set(inventory.map(i => i.name))]; const dosageForms = [...new Set(inventory.map(i => i.dosage))]; const [templateData, setTemplateData] = useState(initialData || { name: '', diagnosis: '', medicines: [] }); const [currentMed, setCurrentMed] = useState({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  const handleAddMedicine = () => {
    if (!currentMed.name || !currentMed.strength) { Alert.alert("Missing Fields", "Please enter Medicine Name and Strength."); return; }
    const newMed = { ...currentMed, id: 'temp_med_' + Date.now() + Math.random() };
    setTemplateData(prev => ({ ...prev, medicines: [...prev.medicines, newMed] }));
    setCurrentMed({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  };
  const handleRemoveMedicine = (id) => { setTemplateData(prev => ({ ...prev, medicines: prev.medicines.filter(m => m.id !== id) })); };
  const handleFinalSave = () => { if (!templateData.name || !templateData.diagnosis) { Alert.alert("Incomplete Data", "Please enter a Template Name and a default Diagnosis."); return; } onSave(templateData); };
  return (
    <View style={styles.screenContainer}>
      <Header title={isEdit ? "Edit Template" : "Add New Template"} onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Input label="Template Name" placeholder="e.g., Fever, Allergy" value={templateData.name} onChange={(t) => setTemplateData({ ...templateData, name: t })} />
        <Input label="Default Diagnosis" placeholder="e.g., Viral Fever" value={templateData.diagnosis} onChange={(t) => setTemplateData({ ...templateData, diagnosis: t })} />
        <Text style={styles.sectionTitle}>Medicines in Template (<Text>{templateData.medicines.length}</Text>)</Text>
        {templateData.medicines.map((med) => (
          <View key={med.id} style={styles.medCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>{med.name} - {med.strength}</Text>
              <Text style={styles.medDetails}>{med.dosage} | {med.frequency} for {med.duration}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveMedicine(med.id)} style={[styles.iconBtn, { backgroundColor: Colors.danger + '20' }]}>
              <FontAwesome5 name="trash-alt" size={14} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={[styles.addItemBox, { marginTop: 10 }]}>
          <Text style={styles.subHeader}>Add Medicine to Template</Text>
          <Text style={styles.label}>Medicine Name</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={currentMed.name} onValueChange={(v) => setCurrentMed({ ...currentMed, name: v })}>
              {medicineNames.map(name => <Picker.Item key={name} label={name} value={name} />)}
            </Picker>
          </View>
          <Input label="Strength" value={currentMed.strength} onChange={(t) => setCurrentMed({ ...currentMed, strength: t })} />
          <TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action }]} onPress={handleAddMedicine}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD TO TEMPLATE</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleFinalSave}>
          <Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} TEMPLATE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const ProceduresHistoryScreen = ({ procedures, navigate, onEdit, onDelete }) => {
  const totalRevenue = procedures.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0); const formattedRevenue = `₹ ${totalRevenue.toLocaleString('en-IN')}`;
  return (
    <View style={styles.screenContainer}>
      <Header title="Procedures History" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_PROCEDURE)} />
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View style={styles.revenueCard}>
          <View>
            <Text style={styles.revenueLabel}>Total Revenue from Procedures</Text>
            <Text style={styles.revenueValue}>{formattedRevenue}</Text>
          </View>
          <FontAwesome5 name="rupee-sign" size={30} color="#FFF" opacity={0.8} />
        </View>
      </View>
      <FlatList
        data={procedures}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.invIconBox, { backgroundColor: Colors.dash6 + '20' }]}>
                <FontAwesome5 name="band-aid" size={20} color={Colors.dash6} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.invName}>{item.procedureName}</Text>
                <Text style={styles.cardSub}>{item.patientName}</Text>
                <Text style={styles.cardSub}>{item.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.procedureCost}>₹{item.cost}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <View style={{ flex: 1 }}>
                {item.notes ? <Text style={styles.notesText}><FontAwesome5 name="sticky-note" /> <Text>{item.notes}</Text></Text> : null}
              </View>
              <TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No procedures recorded yet.</Text></View>}
      />
    </View>
  );
};

const AddProcedureForm = ({ initialData, patients, onSave, onCancel }) => {
  const isEdit = !!initialData; const [form, setForm] = useState(initialData || { patientId: patients[0]?.id, procedureName: '', date: new Date().toLocaleDateString('en-CA'), cost: '', notes: '' }); 
  const handleSave = () => { if (!form.patientId || !form.procedureName || !form.cost) { Alert.alert("Missing Fields", "Please fill in Patient, Procedure Name, and Cost."); return; } onSave(form); };
  return (
    <View style={styles.screenContainer}>
      <Header title={isEdit ? "Edit Procedure" : "Add Procedure"} onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>Select Patient</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>
            {patients.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
          </Picker>
        </View>
        <Input label="Procedure Name" placeholder="e.g., Suture, Dressing" value={form.procedureName} onChange={t => setForm({ ...form, procedureName: t })} />
        <Input label="Cost (₹)" kbd="numeric" value={form.cost} onChange={t => setForm({ ...form, cost: t })} />
        <Input label="Notes (Optional)" placeholder="Any relevant notes..." value={form.notes} onChange={t => setForm({ ...form, notes: t })} multiline={true} style={{ height: 100 }} />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
          <Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} PROCEDURE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const AllPrescriptionHistoryScreen = ({ allPrescriptions, patients, navigate, onDeleteRx }) => {
  const [search, setSearch] = useState('');
  const [viewRx, setViewRx] = useState(null);
  const filteredPrescriptions = allPrescriptions.filter(rx =>
    rx.patientName.toLowerCase().includes(search.toLowerCase()) ||
    rx.diagnosis.toLowerCase().includes(search.toLowerCase())
  );
  const RxTableItem = ({ item }) => {
    const patient = patients.find(p => p.id === item.patientId);
    return (
      <View key={item.id} style={styles.rxTableItem}>
        <View style={styles.rxTableCol}>
          <Text style={styles.rxDate}>{item.date}</Text>
          <Text style={styles.rxDiagnosis}>{item.diagnosis}</Text>
          <Text style={{ fontSize: 12, color: Colors.text, fontWeight: 'bold' }}>{item.patientName}</Text>
          {item.isTapering ? <Text style={styles.taperBadge}>Tapering</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setViewRx(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}>
            <FontAwesome5 name="eye" size={14} color={Colors.action} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigate(Screens.ADD_RX, { ...item, isEdit: true, patient: patient })}
            style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.primary + '20' }]}>
            <FontAwesome5 name="pen" size={14} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDeleteRx(item.id)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]}>
            <FontAwesome5 name="trash" size={14} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <View style={styles.screenContainer}>
      <Header title="All Patient Rx History" onBack={() => navigate(Screens.DASHBOARD)} />
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.subText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Patient or Diagnosis..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 0 }]}>
        Records (<Text>{filteredPrescriptions.length}</Text>)
      </Text>
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <View style={[styles.rxTable, { marginBottom: 20 }]}>
          <View style={styles.rxTableHeader}>
            <Text style={styles.rxHeaderCol}>Patient/Details</Text>
            <Text style={{ width: 120, textAlign: 'right', fontWeight: 'bold', color: Colors.text }}>Actions</Text>
          </View>
          <FlatList
            data={filteredPrescriptions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <RxTableItem item={item} />}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={styles.emptyText}>No matching prescriptions found.</Text>
              </View>
            }
          />
        </View>
      </View>
      <PrescriptionDetailModal rx={viewRx} onClose={() => setViewRx(null)} />
    </View>
  );
};

const PrescriptionHistoryScreen = ({ patient, prescriptions, navigate, onDeleteRx, onEditRx }) => {
  const [viewRx, setViewRx] = useState(null); const [startDate, setStartDate] = useState(new Date('2023-01-01')); const [endDate, setEndDate] = useState(new Date()); const [showDatePicker, setShowDatePicker] = useState(null); const [filterMode, setFilterMode] = useState('recent');
  if (!patient) return null;
  const formattedStartDate = startDate.toLocaleDateString('en-CA');
  const formattedEndDate = endDate.toLocaleDateString('en-CA');
  const filteredPrescriptions = prescriptions.filter(item => item.date >= formattedStartDate && item.date <= formattedEndDate);
  const displayPrescriptions = filterMode === 'recent' ? filteredPrescriptions.slice(0, 10) : filteredPrescriptions;

  const handleExportPdf = async () => { /* PDF export logic */ };
  const onDateChange = (event, selectedDate) => { setShowDatePicker(null); if (event.type === 'set' && selectedDate) { if (showDatePicker === 'start') setStartDate(selectedDate); else if (showDatePicker === 'end') setEndDate(selectedDate); } };
  
  const RxTableItem = ({ item }) => (
    <View key={item.id} style={styles.rxTableItem}>
      <View style={styles.rxTableCol}>
        <Text style={styles.rxDate}>{item.date}</Text>
        <Text style={styles.rxDiagnosis}>{item.diagnosis}</Text>
        <Text style={{ fontSize: 12, color: Colors.subText }}>{item.medicines.length} Medicine(s) {item.templateName ? <Text>({item.templateName})</Text> : null}</Text>
        {item.isTapering ? <Text style={styles.taperBadge}>Tapering</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setViewRx(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="eye" size={14} color={Colors.action} /></TouchableOpacity>
        <TouchableOpacity onPress={() => onEditRx(item)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.primary + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.primary} /></TouchableOpacity>
        <TouchableOpacity onPress={() => onDeleteRx(item.id)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <Header title={`Rx History: ${patient.name}`} onBack={() => navigate(Screens.PATIENT_DETAILS, patient)} onAdd={() => navigate(Screens.ADD_RX, patient)} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.sectionTitleSmall}>Filter by Date</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker('start')} style={styles.pickerBtnSmall}>
              <Text style={styles.pickerTextSmall}>{formattedStartDate}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker('end')} style={styles.pickerBtnSmall}>
              <Text style={styles.pickerTextSmall}>{formattedEndDate}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} onPress={handleExportPdf}>
          <FontAwesome5 name="file-pdf" size={14} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>EXPORT PDF</Text>
        </TouchableOpacity>
        {showDatePicker ? <DateTimePicker value={showDatePicker === 'start' ? startDate : endDate} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} /> : null}
        
        <Text style={styles.sectionTitle}>Prescription History (<Text>{displayPrescriptions.length}</Text>)</Text>
        {displayPrescriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="folder-open" size={50} color={Colors.subText} />
            <Text style={styles.emptyText}>No prescriptions found.</Text>
          </View>
        ) : (
          <View style={styles.rxTable}>
            <View style={styles.rxTableHeader}>
              <Text style={styles.rxHeaderCol}>Date/Diagnosis</Text>
              <Text style={{ width: 120, textAlign: 'right', fontWeight: 'bold', color: Colors.text }}>Actions</Text>
            </View>
            {displayPrescriptions.map(item => <RxTableItem key={item.id} item={item} />)}
          </View>
        )}
      </ScrollView>
      <PrescriptionDetailModal rx={viewRx} onClose={() => setViewRx(null)} />
    </View>
  );
};

// --- UPDATED NEW PRESCRIPTION FORM ---

const NewPrescriptionForm = ({ patient, inventory, templates, onSave, onCancel, initialData }) => {
  const isEdit = !!initialData;
  const medicineNames = inventory.length > 0 ? [...new Set(inventory.map(i => i.name))] : ['Paracetamol', 'Amoxicillin', 'Azithromycin', 'Pantoprazole'];
  const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Sachet'];
  
  const [rxData, setRxData] = useState(
    initialData
      ? { ...initialData, vitals: initialData.vitals || patient.vitals || {}, templateId: initialData.templateId || 'template-none' }
      : {
        patientId: patient.id, diagnosis: '', notes: '', isTapering: false, 
        vitals: patient?.vitals || {}, medicines: [], proceduresPerformed: [], templateId: 'template-none', taperingPlan: [],
      }
  );

  // Modal Visibility State
  const [showMedModal, setShowMedModal] = useState(false);
  const [showTaperModal, setShowTaperModal] = useState(false);
  const [showProcModal, setShowProcModal] = useState(false);

  // Form States for Modals
  const [currentMed, setCurrentMed] = useState({ name: medicineNames[0], strength: '', dosage: dosageForms[0], frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  const [currentProc, setCurrentProc] = useState({ name: '', cost: '' });
  const [currentTaperStep, setCurrentTaperStep] = useState({ title: '', duration: DURATION_OPTIONS[0], dose: '' });

  // Handle Template Selection
  useEffect(() => {
    if (isEdit) return;
    const selectedTemplate = templates.find(t => t.id === rxData.templateId);
    if (selectedTemplate && selectedTemplate.id !== 'template-none') {
      setRxData(prev => ({
        ...prev,
        diagnosis: selectedTemplate.diagnosis,
        medicines: selectedTemplate.medicines.map(m => ({ ...m, id: 'med_' + Date.now() + Math.random() }))
      }));
    } else if (selectedTemplate && selectedTemplate.id === 'template-none') {
      setRxData(prev => ({ ...prev, diagnosis: '', medicines: [] }));
    }
  }, [rxData.templateId]);

  const handleAddMedicine = () => {
    if (!currentMed.name) return;
    setRxData(prev => ({ ...prev, medicines: [...prev.medicines, { ...currentMed, id: Date.now().toString() }] }));
    setShowMedModal(false);
    setCurrentMed(prev => ({ ...prev, strength: '', instructions: '' }));
  };

  const handleAddProcedure = () => {
    if (!currentProc.name) return;
    setRxData(prev => ({ ...prev, proceduresPerformed: [...prev.proceduresPerformed, { ...currentProc, id: Date.now().toString() }] }));
    setShowProcModal(false);
    setCurrentProc({ name: '', cost: '' });
  };

  const handleAddTaperStep = () => {
    if (!currentTaperStep.title) return;
    setRxData(prev => ({ ...prev, taperingPlan: [...prev.taperingPlan, { ...currentTaperStep, id: Date.now().toString() }] }));
    setShowTaperModal(false);
    setCurrentTaperStep({ title: '', duration: DURATION_OPTIONS[0], dose: '' });
  };

  const handleRemove = (type, id) => {
      if(type === 'med') setRxData(prev => ({...prev, medicines: prev.medicines.filter(m => m.id !== id)}));
      if(type === 'proc') setRxData(prev => ({...prev, proceduresPerformed: prev.proceduresPerformed.filter(m => m.id !== id)}));
      if(type === 'taper') setRxData(prev => ({...prev, taperingPlan: prev.taperingPlan.filter(m => m.id !== id)}));
  }

  // --- MODAL COMPONENTS (FIXED UI) ---

  const AddMedicineModal = () => (
    <Modal visible={showMedModal} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { backgroundColor: Colors.primary }]}>
            <FontAwesome5 name="pills" size={20} color="#FFF" />
            <Text style={styles.modalTitleWhite}>Add New Medicine</Text>
            <TouchableOpacity onPress={() => setShowMedModal(false)}>
              <Ionicons name="close-circle" size={28} color="#FFF" opacity={0.8} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Medicine Name</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={currentMed.name} onValueChange={(v) => setCurrentMed({ ...currentMed, name: v })} dropdownIconColor={Colors.primary}>
                  {medicineNames.map(name => <Picker.Item key={name} label={name} value={name} style={{fontSize: 16}} />)}
                </Picker>
            </View>

            <View style={styles.modalRow}>
                <View style={{flex:1, marginRight: 10}}>
                    <Text style={styles.inputLabel}>Strength</Text>
                    <TextInput style={styles.modalInput} placeholder="e.g. 500mg" value={currentMed.strength} onChangeText={t => setCurrentMed({...currentMed, strength: t})} placeholderTextColor="#999" />
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.inputLabel}>Dosage Form</Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={currentMed.dosage} onValueChange={v => setCurrentMed({ ...currentMed, dosage: v })}>
                            {dosageForms.map(f => <Picker.Item key={f} label={f} value={f} style={{fontSize: 14}} />)}
                        </Picker>
                    </View>
                </View>
            </View>

            <View style={styles.modalRow}>
                <View style={{flex:1, marginRight: 10}}>
                    <Text style={styles.inputLabel}>Frequency</Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={currentMed.frequency} onValueChange={v => setCurrentMed({ ...currentMed, frequency: v })}>
                            {FREQUENCY_OPTIONS.map(f => <Picker.Item key={f} label={f} value={f} style={{fontSize: 14}} />)}
                        </Picker>
                    </View>
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.inputLabel}>Duration</Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={currentMed.duration} onValueChange={v => setCurrentMed({ ...currentMed, duration: v })}>
                            {DURATION_OPTIONS.map(d => <Picker.Item key={d} label={d} value={d} style={{fontSize: 14}} />)}
                        </Picker>
                    </View>
                </View>
            </View>

            <Text style={styles.inputLabel}>Specific Instructions</Text>
            <TextInput style={[styles.modalInput, {height: 60, textAlignVertical: 'top'}]} multiline placeholder="e.g. After Food" value={currentMed.instructions} onChangeText={t => setCurrentMed({...currentMed, instructions: t})} placeholderTextColor="#999" />

            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: Colors.primary}]} onPress={handleAddMedicine}>
                <Text style={styles.modalBtnText}>ADD TO PRESCRIPTION</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const AddTaperModal = () => (
    <Modal visible={showTaperModal} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { backgroundColor: Colors.warning }]}>
             <FontAwesome5 name="chart-line" size={20} color="#FFF" />
             <Text style={styles.modalTitleWhite}>Add Tapering Step</Text>
             <TouchableOpacity onPress={() => setShowTaperModal(false)}>
              <Ionicons name="close-circle" size={28} color="#FFF" opacity={0.8} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Stage / Instruction</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Week 1 - 1 tab BD" value={currentTaperStep.title} onChangeText={t => setCurrentTaperStep({...currentTaperStep, title: t})} />

            <View style={styles.modalRow}>
                <View style={{flex:1, marginRight:10}}>
                    <Text style={styles.inputLabel}>Duration</Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={currentTaperStep.duration} onValueChange={v => setCurrentTaperStep({ ...currentTaperStep, duration: v })}>
                            {DURATION_OPTIONS.map(d => <Picker.Item key={d} label={d} value={d} style={{fontSize: 14}} />)}
                        </Picker>
                    </View>
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.inputLabel}>Dose</Text>
                    <TextInput style={styles.modalInput} placeholder="1/2 Tab" value={currentTaperStep.dose} onChangeText={t => setCurrentTaperStep({...currentTaperStep, dose: t})} />
                </View>
            </View>
             <TouchableOpacity style={[styles.modalBtn, {backgroundColor: Colors.warning}]} onPress={handleAddTaperStep}>
                <Text style={styles.modalBtnText}>ADD STEP</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const AddProcedureModal = () => (
    <Modal visible={showProcModal} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { backgroundColor: Colors.dash6 }]}>
            <FontAwesome5 name="band-aid" size={20} color="#FFF" />
            <Text style={styles.modalTitleWhite}>Add Procedure</Text>
            <TouchableOpacity onPress={() => setShowProcModal(false)}>
              <Ionicons name="close-circle" size={28} color="#FFF" opacity={0.8} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Procedure Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Dressing" value={currentProc.name} onChangeText={t => setCurrentProc({...currentProc, name: t})} />
            
            <Text style={styles.inputLabel}>Cost (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 500" keyboardType="numeric" value={currentProc.cost} onChangeText={t => setCurrentProc({...currentProc, cost: t})} />

            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: Colors.dash6}]} onPress={handleAddProcedure}>
                <Text style={styles.modalBtnText}>ADD PROCEDURE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.screenContainer}>
      <Header title={`${isEdit ? 'Edit' : 'New'} Rx: ${patient.name}`} onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        {/* Template & Notes */}
        <View style={styles.sectionContainer}>
            <Text style={styles.inputLabel}>Select Template</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={rxData.templateId} onValueChange={(v) => setRxData({ ...rxData, templateId: v })}>
                    {templates.map(t => <Picker.Item key={t.id} label={t.name} value={t.id} style={{fontSize: 16}} />)}
                </Picker>
            </View>
        </View>

        <View style={styles.sectionContainer}>
             <Text style={styles.inputLabel}>Diagnosis</Text>
             <TextInput style={styles.mainInput} placeholder="e.g., UROLITHIASIS" value={rxData.diagnosis} onChangeText={t => setRxData({...rxData, diagnosis: t})} />
        </View>

         <View style={styles.sectionContainer}>
             <Text style={styles.inputLabel}>Doctor's Notes/Additional Instructions</Text>
             <TextInput style={[styles.mainInput, {height: 80, textAlignVertical: 'top'}]} multiline value={rxData.notes} onChangeText={t => setRxData({...rxData, notes: t})} />
        </View>

        {/* Medicines Section */}
        <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Prescribed Medicines ({rxData.medicines.length})</Text>
            <TouchableOpacity onPress={()=>setShowMedModal(true)} style={[styles.miniBtn, {backgroundColor: Colors.primary}]}>
                <FontAwesome5 name="plus" color="#FFF" size={12} />
                <Text style={styles.miniBtnText}>ADD</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
            {rxData.medicines.length === 0 && <Text style={styles.emptyText}>No medicines added.</Text>}
            {rxData.medicines.map((item, idx) => (
                <View key={item.id || idx} style={styles.rxItemCard}>
                    <View style={{flex:1}}>
                        <Text style={styles.rxItemTitle}>{item.name} <Text style={{fontSize:14, fontWeight:'normal'}}>{item.strength}</Text></Text>
                        <Text style={styles.rxItemSub}>{item.dosage} | {item.frequency} | {item.duration}</Text>
                        {item.instructions ? <Text style={styles.rxItemNote}>{item.instructions}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={()=>handleRemove('med', item.id)} style={styles.deleteBtn}>
                        <FontAwesome5 name="trash" size={14} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            ))}
        </View>

        {/* Tapering Section */}
        <View style={[styles.sectionContainer, {marginTop: 20}]}>
            <View style={styles.taperHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Tapering Plan</Text>
                    <Text style={{fontSize: 12, color: Colors.subText}}>Use tapering when dose/frequency gradually changes over time.</Text>
                </View>
                <TouchableOpacity onPress={()=> setRxData(p => ({...p, isTapering: !p.isTapering}))}>
                    <FontAwesome5 name={rxData.isTapering ? "toggle-on" : "toggle-off"} size={30} color={rxData.isTapering ? Colors.warning : Colors.subText} />
                </TouchableOpacity>
            </View>

            {rxData.isTapering && (
                <View style={[styles.listContainer, {borderColor: Colors.warning, backgroundColor: '#FFFBEB'}]}>
                     {rxData.taperingPlan.length === 0 && <Text style={styles.emptyText}>No steps added.</Text>}
                     {rxData.taperingPlan.map((item, idx) => (
                        <View key={item.id || idx} style={styles.rxItemCard}>
                            <View style={{flex:1}}>
                                <Text style={styles.rxItemTitle}>{idx+1}. {item.title}</Text>
                                <Text style={styles.rxItemSub}>{item.duration} - {item.dose}</Text>
                            </View>
                             <TouchableOpacity onPress={()=>handleRemove('taper', item.id)} style={styles.deleteBtn}>
                                <FontAwesome5 name="trash" size={14} color={Colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity onPress={()=>setShowTaperModal(true)} style={[styles.dashedBtn, {borderColor: Colors.warning}]}>
                        <Text style={{color: Colors.warning, fontWeight: 'bold'}}>+ ADD TAPER STEP</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {/* Procedures Section */}
        <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Procedures Performed ({rxData.proceduresPerformed.length})</Text>
            <TouchableOpacity onPress={()=>setShowProcModal(true)} style={[styles.miniBtn, {backgroundColor: Colors.dash6}]}>
                <FontAwesome5 name="plus" color="#FFF" size={12} />
                <Text style={styles.miniBtnText}>ADD</Text>
            </TouchableOpacity>
        </View>
        <View style={[styles.listContainer, {borderColor: Colors.dash6, backgroundColor: '#F0FDF4'}]}>
             {rxData.proceduresPerformed.length === 0 && <Text style={styles.emptyText}>No procedures added.</Text>}
             {rxData.proceduresPerformed.map((item, idx) => (
                <View key={item.id || idx} style={styles.rxItemCard}>
                    <View style={{flex:1}}>
                        <Text style={styles.rxItemTitle}>{item.name}</Text>
                        <Text style={styles.rxItemSub}>Cost: ₹{item.cost}</Text>
                    </View>
                     <TouchableOpacity onPress={()=>handleRemove('proc', item.id)} style={styles.deleteBtn}>
                        <FontAwesome5 name="trash" size={14} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            ))}
        </View>

        <TouchableOpacity style={styles.saveRxBtn} onPress={() => onSave(rxData)}>
            <Text style={styles.saveRxText}>{isEdit ? 'UPDATE' : 'SAVE'} PRESCRIPTION</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Render Modals */}
      <AddMedicineModal />
      <AddTaperModal />
      <AddProcedureModal />
    </View>
  );
};

const PrescriptionDetailModal = ({ rx, onClose }) => {
  if (!rx) return null; const getVitalValue = (key, unit = '') => { const val = rx.vitals?.[key]; if (val === null || val === undefined || val === '') return 'N/A'; const displayUnit = key === 'bp' ? '' : unit; return `${val}${displayUnit}`; };
  return (
    <Modal visible={!!rx} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '90%' }]}>
          <Text style={styles.modalTitle}>Prescription Details</Text>
          <Text style={{ textAlign: 'center', color: Colors.subText, marginBottom: 15 }}>{rx.patientName} - {rx.date}</Text>
          <ScrollView style={{ maxHeight: height * 0.7 }}>
            <Text style={styles.sectionTitleSmall}>Diagnosis</Text>
            <Text style={styles.detailText}>{rx.diagnosis}</Text>
            <Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Vitals</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <DetailPill label="BP" value={getVitalValue('bp')} unit="mmHg" color={Colors.action} />
              <DetailPill label="HR" value={getVitalValue('hr')} unit="bpm" color={Colors.danger} />
              <DetailPill label="Temp" value={getVitalValue('temp')} unit="°F" color={Colors.warning} />
              <DetailPill label="SpO2" value={getVitalValue('spo2')} unit="%" color={Colors.success} />
              <DetailPill label="Weight" value={getVitalValue('weight')} unit="kg" color={Colors.primary} />
            </View>
            <Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Medicines</Text>
            {rx.medicines.length === 0 ? <Text style={styles.emptyText}>No medicines prescribed.</Text> : rx.medicines.map((med, index) => (
              <View key={med.id || index} style={styles.medDetailItem}>
                <Text style={styles.medNameDetail}>{index + 1}. {med.name} {med.strength}</Text>
                <Text style={styles.medDetailsDetail}>{med.dosage} | {med.frequency} for {med.duration}</Text>
                <Text style={styles.medInstructionsDetail}>* {med.instructions}</Text>
              </View>
            ))}
            {rx.isTapering && rx.taperingPlan && rx.taperingPlan.length > 0 ? (
              <>
                <Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Tapering Plan</Text>
                {rx.taperingPlan.map((step, index) => (
                  <View key={step.id || index} style={styles.medDetailItem}>
                    <Text style={styles.medNameDetail}>{index + 1}. {step.title}</Text>
                    <Text style={styles.medDetailsDetail}>{step.duration} • {step.dose}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {rx.notes ? (
              <>
                <Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Doctor's Notes</Text>
                <Text style={styles.detailText}>{rx.notes}</Text>
              </>
            ) : null}
          </ScrollView>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.subText, padding: 10, marginTop: 15 }]} onPress={onClose}>
            <Text style={[styles.btnText, { fontSize: 14 }]}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


// ------------------- Main App & Logic -------------------

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(Screens.LOGIN);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [labs, setLabs] = useState(INITIAL_LABS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [rxTemplates, setRxTemplates] = useState(INITIAL_TEMPLATES);
  const [procedures, setProcedures] = useState(INITIAL_PROCEDURES);
  const [selectedData, setSelectedData] = useState(null);

  const navigate = (screen, data = null) => {
    setIsLoading(true);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedData(data);
      setCurrentScreen(screen);
      setDrawerOpen(false);
      setIsLoading(false);
    }, 400);
  };

  const handleLogin = (username, password) => {
    setIsLoading(true);
    setTimeout(() => {
      if (username === '1' && password === '1') {
        setIsLoading(false);
        navigate(Screens.DASHBOARD);
      } else {
        setIsLoading(false);
        Alert.alert("Login Failed", "Invalid Username or Password.\nTry: 1 / 1");
      }
    }, 1500);
  };

  const handleAppointmentDone = (id) => {
    Alert.alert("Confirm Done", "Mark appointment as complete?", [
      { text: "Cancel" },
      { text: "Done", style: 'destructive', onPress: () => { setAppointments(appointments.filter(a => a.id !== id)); } }
    ]);
  };
  
  const handleSavePatient = (p, appointmentDetails) => {
    if (p.id) setPatients(patients.map(x => x.id === p.id ? p : x));
    else setPatients(prev => [...prev, { ...p, id: Date.now().toString(), vitals: p.vitals || {} }]);
    navigate(Screens.PATIENT_LIST);
  };

  const handleDeletePatient = (id) => { setPatients(patients.filter(x => x.id !== id)); navigate(Screens.PATIENT_LIST); };
  const handleSavePrescription = (rx) => {
    const p = patients.find(p => p.id === rx.patientId);
    const newRx = { ...rx, id: rx.id || 'rx_' + Date.now(), patientName: p?.name || 'Unknown', date: new Date().toLocaleDateString('en-CA') };
    if (rx.id) setPrescriptions(prescriptions.map(x => x.id === rx.id ? newRx : x));
    else setPrescriptions(prev => [newRx, ...prev]);
    navigate(Screens.RX_HISTORY, p);
  };
  const handleDeleteRx = (id) => { setPrescriptions(prescriptions.filter(x => x.id !== id)); };
  const handleQuickBook = (patient, time, reason, type) => {
    setAppointments(prev => [...prev, { id: 'appt_' + Date.now(), time, patientName: patient.name, type, reason, status: 'Pending' }]);
    navigate(Screens.DASHBOARD);
  };
  const handleSaveLab = (l) => { setLabs([...labs, { ...l, id: Date.now().toString() }]); navigate(Screens.LAB_LIST); };
  const handleDeleteLab = (id) => { setLabs(labs.filter(x => x.id !== id)); };
  const updateInventoryStock = (id, amount) => { setInventory(inventory.map(i => i.id === id ? {...i, stock: i.stock + amount} : i)); };
  const deleteInventoryItem = (id) => { setInventory(inventory.filter(i => i.id !== id)); };
  const addNewMedicine = (name, dosage, strength) => { setInventory([...inventory, { id: Date.now().toString(), name, dosage, strength, stock: 0, status: 'Out' }]); };
  const handleUpdateInventoryItem = (itemId, updatedData) => { setInventory(inventory.map(item => item.id === itemId ? { ...item, ...updatedData } : item)); };
  const handleSaveTemplate = (template) => { setRxTemplates(prev => { if(template.id) return prev.map(t => t.id === template.id ? template : t); else return [...prev, { ...template, id: 'temp_' + Date.now() }]; }); navigate(Screens.TEMPLATE_MANAGER); };
  const handleDeleteTemplate = (id) => { setRxTemplates(rxTemplates.filter(t => t.id !== id)); };
  const handleSaveProcedure = (proc) => { setProcedures([...procedures, { ...proc, id: 'proc_' + Date.now() }]); navigate(Screens.PROCEDURES_HISTORY); };
  const handleDeleteProcedure = (id) => { setProcedures(procedures.filter(p => p.id !== id)); };

  const renderContent = () => {
    switch (currentScreen) {
      case Screens.LOGIN: return <LoginScreen onLogin={handleLogin} />;
      case Screens.DASHBOARD: return <Dashboard patients={patients} appointments={appointments} inventory={inventory} templates={rxTemplates} procedures={procedures} prescriptions={prescriptions} navigate={navigate} openDrawer={() => setDrawerOpen(true)} onDeleteAppt={handleAppointmentDone} />;
      case Screens.PATIENT_LIST: return <PatientList patients={patients} navigate={navigate} onDelete={handleDeletePatient} onEdit={(p) => navigate(Screens.ADD_PATIENT, p)} onBook={handleQuickBook} />;
      case Screens.ADD_PATIENT: return <PatientForm initialData={selectedData} onSave={handleSavePatient} onCancel={() => navigate(Screens.PATIENT_LIST)} />;
      case Screens.PATIENT_DETAILS: return <PatientDetails patient={selectedData} labs={labs} navigate={navigate} />;
      case Screens.RX_HISTORY: return <PrescriptionHistoryScreen patient={selectedData} prescriptions={prescriptions.filter(r => r.patientId === selectedData?.id).sort((a, b) => new Date(b.date) - new Date(a.date))} navigate={navigate} onDeleteRx={(id) => handleDeleteRx(id)} onEditRx={(rx) => navigate(Screens.ADD_RX, { ...rx, isEdit: true, patient: selectedData })} />;
      case Screens.ALL_RX_HISTORY: return <AllPrescriptionHistoryScreen allPrescriptions={prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date))} patients={patients} navigate={navigate} onDeleteRx={(id) => handleDeleteRx(id)} />;
      case Screens.ADD_RX: {
        const isEdit = selectedData?.isEdit;
        const patientFromSelectedData = isEdit ? selectedData.patient : selectedData;
        return <NewPrescriptionForm patient={patientFromSelectedData} inventory={inventory} templates={rxTemplates} onSave={handleSavePrescription} onCancel={() => navigate(Screens.RX_HISTORY, patientFromSelectedData)} initialData={isEdit ? selectedData : null} />;
      }
      case Screens.LAB_LIST: return <LabList labs={labs} navigate={navigate} onDelete={handleDeleteLab} onEdit={(l) => navigate(Screens.ADD_LAB, l)} />;
      case Screens.ADD_LAB: return <LabForm initialData={selectedData} patients={patients} onSave={handleSaveLab} onCancel={() => navigate(Screens.LAB_LIST)} />;
      case Screens.INVENTORY: return <InventoryScreen inventory={inventory} onUpdateStock={updateInventoryStock} onAddItem={addNewMedicine} onDeleteItem={deleteInventoryItem} onUpdateItem={handleUpdateInventoryItem} navigate={navigate} />;
      case Screens.TEMPLATE_MANAGER: return <TemplateManagerScreen templates={rxTemplates} navigate={navigate} onEdit={(t) => navigate(Screens.ADD_TEMPLATE, t)} onDelete={handleDeleteTemplate} />;
      case Screens.ADD_TEMPLATE: return <AddTemplateForm initialData={selectedData} inventory={inventory} onSave={handleSaveTemplate} onCancel={() => navigate(Screens.TEMPLATE_MANAGER)} />;
      case Screens.PROCEDURES_HISTORY: return <ProceduresHistoryScreen procedures={procedures} navigate={navigate} onDelete={handleDeleteProcedure} onEdit={(p) => navigate(Screens.ADD_PROCEDURE, p)} />;
      case Screens.ADD_PROCEDURE: return <AddProcedureForm patients={patients} initialData={selectedData} onSave={handleSaveProcedure} onCancel={() => navigate(Screens.PROCEDURES_HISTORY)} />;
      default: return <Dashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <LoadingOverlay visible={isLoading} />
      {renderContent()}
      
      {drawerOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderContent}>
                <View style={styles.avatarLarge}><Text style={styles.avatarText}>DM</Text></View>
                <Text style={styles.drawerTitle}>{DOCTOR_NAME}</Text>
                <Text style={styles.drawerSub}>Medical Admin</Text>
                <View style={styles.drawerContactBox}>
                  <TouchableOpacity style={styles.drawerContactBtn} onPress={() => Linking.openURL(`tel:${DOCTOR_PHONE}`)}>
                    <FontAwesome5 name="phone-alt" size={14} color={Colors.primary} />
                    <Text style={styles.drawerContactText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.drawerContactBtn, { backgroundColor: Colors.whatsapp }]} onPress={() => Linking.openURL(`whatsapp://send?phone=${DOCTOR_WHATSAPP_NO}`)}>
                    <FontAwesome5 name="whatsapp" size={16} color="#FFF" />
                    <Text style={styles.drawerContactText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <ScrollView style={{ paddingTop: 10 }}>
              <DrawerItem icon="th-large" label="Dashboard" color={Colors.dash1} onPress={() => navigate(Screens.DASHBOARD)} />
              <DrawerItem icon="users" label="Patients" color={Colors.dash2} onPress={() => navigate(Screens.PATIENT_LIST)} />
              <DrawerItem icon="file-prescription" label="All Patient Rx History" color={Colors.primaryDark} onPress={() => navigate(Screens.ALL_RX_HISTORY)} />
              <DrawerItem icon="file-medical-alt" label="Lab Reports" color={Colors.dash3} onPress={() => navigate(Screens.LAB_LIST)} />
              <DrawerItem icon="band-aid" label="Procedures" color={Colors.dash6} onPress={() => navigate(Screens.PROCEDURES_HISTORY)} />
              <DrawerItem icon="capsules" label="Inventory" color={Colors.dash4} onPress={() => navigate(Screens.INVENTORY)} />
              <DrawerItem icon="file-signature" label="Manage Templates" color={Colors.dash5} onPress={() => navigate(Screens.TEMPLATE_MANAGER)} />
              <View style={styles.divider} />
              <DrawerItem icon="sign-out-alt" label="Logout" color={Colors.danger} onPress={() => setCurrentScreen(Screens.LOGIN)} />
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  screenContainer: { flex: 1, backgroundColor: Colors.bg },
  header: { height: 80, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 15, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 10 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 15, marginBottom: 10 },
  loaderOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loaderBox: { backgroundColor: '#FFF', padding: 25, borderRadius: 15, alignItems: 'center', elevation: 10 },
  loaderText: { marginTop: 10, color: Colors.text, fontWeight: 'bold' },
  welcomeBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primaryDark, padding: 20, borderRadius: 20, marginBottom: 20 },
  welcomeText: { color: '#FFF', fontSize: 14, opacity: 0.8 },
  docName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, alignItems: 'center', elevation: 4 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridCount: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  gridTitle: { fontSize: 14, color: Colors.subText },
  apptCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center', elevation: 2 },
  timeBox: { backgroundColor: '#E0F2F1', padding: 8, borderRadius: 8 },
  timeText: { color: Colors.primary, fontWeight: 'bold' },
  apptName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  apptType: { fontSize: 12, color: Colors.subText },
  apptSection: { backgroundColor: '#E0F7FA', padding: 15, borderRadius: 10, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: Colors.primary },
  sectionTitleSmall: { fontSize: 16, fontWeight: 'bold', color: Colors.primaryDark, flex: 1 },
  toggleBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  pickerBtn: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#B2DFDB' },
  pickerBtnSmall: { flexDirection: 'row', backgroundColor: '#FFF', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#B2DFDB' },
  pickerText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  pickerTextSmall: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
  
  // Modal Common Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: height * 0.9, backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden' }, // Added overflow: hidden
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: Colors.primaryDark, marginTop: 15 },
  
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  timeSlot: { padding: 10, margin: 5, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#FAFAFA' },
  activeTimeSlot: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeSlotText: { color: Colors.text },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: 13, color: Colors.subText },
  listAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10, alignItems: 'center' },
  actionLabelBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F1', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, marginRight: 10 },
  actionLabelText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  iconBtn: { padding: 8, backgroundColor: '#F5F7FA', borderRadius: 8 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', margin: 20, marginBottom: 10, borderRadius: 10, padding: 10, alignItems: 'center', elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  idCard: { backgroundColor: Colors.text, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 8 },
  idTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  idTitle: { color: '#FFF', fontWeight: 'bold', letterSpacing: 2 },
  idContent: { flexDirection: 'row', alignItems: 'center' },
  idPhoto: { width: 90, height: 110, borderRadius: 10, backgroundColor: '#EEE' },
  idName: { color: Colors.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  idRow: { color: '#CFD8DC', fontSize: 12, marginBottom: 3 },
  vitalGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalCard: { width: '30%', backgroundColor: '#FFF', padding: 10, borderRadius: 12, alignItems: 'center', borderTopWidth: 4, elevation: 3, justifyContent: 'space-between' },
  vitalVal: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  vitalLabel: { fontSize: 12, color: Colors.subText },
  vitalFormCard: { backgroundColor: '#EEF2FF', borderRadius: 16, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: Colors.primary + '33' },
  
  uploadCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0F2F1', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  label: { fontSize: 12, fontWeight: 'bold', color: Colors.subText, marginBottom: 5, marginTop: 5 },
  inputBox: { backgroundColor: '#FFF', borderRadius: 10, padding: Platform.OS === 'ios' ? 15 : 12, fontSize: 16, borderWidth: 1, borderColor: '#CFD8DC' },
  btnPrimary: { backgroundColor: Colors.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  labThumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  imagePicker: { height: 150, backgroundColor: '#F5F7FA', borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CFD8DC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  
  // Rx History & Tables
  inputBoxRx: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#CFD8DC', flexDirection: 'row', alignItems: 'center' },
  rxTable: { backgroundColor: Colors.card, borderRadius: 15, elevation: 2, overflow: 'hidden' },
  rxTableHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  rxHeaderCol: { flex: 1, fontWeight: 'bold', color: Colors.text },
  rxTableItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  rxTableCol: { flex: 1, paddingRight: 10 },
  rxDate: { fontSize: 12, color: Colors.subText },
  rxDiagnosis: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: Colors.card, borderRadius: 15, marginTop: 20 },
  emptyText: { color: Colors.subText, marginTop: 15, fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  
  // Med Card (Old Style for Template Manager)
  medCard: { flexDirection: 'row', backgroundColor: '#F5F7FA', padding: 10, borderRadius: 10, marginBottom: 8, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: Colors.action },
  medName: { fontWeight: 'bold', color: Colors.text },
  medDetails: { fontSize: 12, color: Colors.subText, fontStyle: 'italic' },
  
  detailText: { padding: 10, backgroundColor: Colors.bg, borderRadius: 8, marginBottom: 10, color: Colors.text },
  medDetailItem: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 10, marginBottom: 5 },
  medNameDetail: { fontWeight: 'bold', color: Colors.primaryDark, fontSize: 15 },
  medDetailsDetail: { fontSize: 12, color: Colors.subText, marginTop: 2 },
  medInstructionsDetail: { fontSize: 13, color: Colors.text, marginTop: 5 },
  
  // Drawer
  drawerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, flexDirection: 'row' },
  drawer: { width: width * 0.75, backgroundColor: '#FFF', height: '100%' },
  drawerHeader: { justifyContent: 'flex-end', padding: 20, backgroundColor: Colors.bg },
  drawerHeaderContent: {},
  drawerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginTop: 10 },
  drawerSub: { color: Colors.subText },
  drawerItem: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
  drawerLabel: { marginLeft: 20, fontSize: 16, fontWeight: '500' },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  
  // Login
  loginContainer: { flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  loginCard: { width: '85%', backgroundColor: '#FFF', padding: 40, borderRadius: 30, alignItems: 'center', elevation: 15 },
  logoBubble: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
  loginTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.primaryDark },
  loginSub: { color: Colors.subText, marginBottom: 30 },
  loginBtn: { width: '100%', backgroundColor: Colors.action, padding: 15, borderRadius: 25, alignItems: 'center', elevation: 5, marginTop: 20 },
  loginInputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 20, paddingBottom: 5 },
  
  // Inventory
  addItemBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 3 },
  subHeader: { fontWeight: 'bold', marginBottom: 10, color: Colors.primary },
  btnSmall: { backgroundColor: Colors.primary, padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  invCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, alignItems: 'center' },
  invIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  invName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  invStrength: { fontSize: 14, fontWeight: 'normal', color: Colors.subText },
  invUnit: { fontSize: 12, color: Colors.primary, marginTop: 2, fontStyle: 'italic' },
  stockStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  counterContainer: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { padding: 8 },
  
  alertWidget: { backgroundColor: '#FFEBEE', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#FFCDD2' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  alertTitle: { color: Colors.danger, fontWeight: 'bold', marginLeft: 10 },
  alertItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  alertName: { fontWeight: '600', color: Colors.text },
  alertStatus: { fontSize: 12, fontWeight: 'bold' },
  
  // Procedures
  revenueCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dash6, padding: 20, borderRadius: 20, elevation: 5, marginBottom: 10 },
  revenueLabel: { color: '#FFF', fontSize: 14, opacity: 0.8 },
  revenueValue: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  procedureCost: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  notesText: { fontSize: 12, color: Colors.subText, fontStyle: 'italic', flexShrink: 1 },
  
  // Dashboard Extras
  drawerContactBox: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15, width: '100%' },
  drawerContactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '20', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, },
  drawerContactText: { marginLeft: 8, fontWeight: 'bold', color: Colors.primary },
  emergencyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.danger + '20', padding: 15, borderRadius: 15, marginTop: 20 },
  emergencyTitle: { fontWeight: 'bold', color: Colors.danger },
  emergencyNumber: { fontSize: 18, color: Colors.text, fontWeight: 'bold' },
  callNowBtn: { backgroundColor: Colors.danger, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  callNowText: { color: '#FFF', fontWeight: 'bold' },
  
  // --- NEW RX UI SPECIFIC STYLES ---
  sectionContainer: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  mainInput: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderColor, fontSize: 16 },
  listContainer: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: Colors.borderColor, overflow: 'hidden' },
  rxItemCard: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  rxItemTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  rxItemSub: { fontSize: 14, color: Colors.subText, marginTop: 2 },
  rxItemNote: { fontSize: 12, color: Colors.action, fontStyle: 'italic', marginTop: 2 },
  deleteBtn: { padding: 10 },
  miniBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  miniBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },
  saveRxBtn: { backgroundColor: Colors.primaryDark, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 5 },
  saveRxText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  taperHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dashedBtn: { borderStyle: 'dashed', borderWidth: 1, padding: 12, alignItems: 'center', margin: 10, borderRadius: 8 },
  taperBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: Colors.warning + '33', color: Colors.warning, fontSize: 11, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },

  // --- POP-UP / MODAL SPECIFIC STYLES ---
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, justifyContent: 'space-between' },
  modalTitleWhite: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginLeft: 10, flex: 1 },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 6, marginTop: 10 },
  modalInput: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', fontSize: 16, color: '#1F2937' },
  pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB', overflow: 'hidden', justifyContent: 'center', height: 50 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 25, marginBottom: 10, elevation: 3 },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});