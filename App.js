import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  Dimensions, StatusBar, FlatList, Image, Platform, Alert,
  LayoutAnimation, UIManager, Modal, SafeAreaView, Linking, ActivityIndicator, Share
} from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// --- CONFIGURATION ---
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

// UPDATED CLINIC DETAILS
const DOCTOR_NAME = 'Dr. MANSOOR ALI V. P.';
const DOCTOR_QUALIFICATION = 'MD (PHYSICIAN)';
const DOCTOR_REG_NO = '35083';
const DOCTOR_PHONE = '+91 9895353078';
const CLINIC_NAME = 'PATHAPPIRIYAM CLINIC';
const CLINIC_BOOKING_NO = '+918606344694';
const EMERGENCY_CONTACT = '112';

// Enable LayoutAnimation
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// --- COLORS (Old Theme Preserved for Dashboard) ---
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
  // Specific Colors for the New ID Card Design
  idCardBg: '#00796B', // Teal Green
  idCardLine: '#FFC107', // Yellow
  // Dashboard tile colors
  dash1: '#6366F1', 
  dash2: '#0EA5E9', 
  dash3: '#F97316', 
  dash4: '#EC4899', 
  dash5: '#8B5CF6', 
  dash6: '#22C55E', 
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
  { id: '6927DAF9', name: 'Shayla', age: '50', gender: 'Female', phone: '8891479505', blood: 'O+', image: null, vitals: { bp: '120/80', hr: '72', temp: '98.6', spo2: '98', weight: '65' } },
  { id: '2', name: 'Suhaim', age: '50', gender: 'Male', phone: '08891479505', blood: 'A+', image: null, vitals: { bp: '130/85', hr: '80', temp: '99', spo2: '97', weight: '75' } }
];
const INITIAL_LABS = [];
const INITIAL_INVENTORY = [
  { id: '101', name: 'Paracetamol', strength: '500mg', dosage: 'Tablet', stock: 120, status: 'Good' },
  { id: '102', name: 'Prolomet', strength: '25mg', dosage: 'Tablet', stock: 50, status: 'Good' },
];
const INITIAL_APPOINTMENTS = [];
const INITIAL_PRESCRIPTIONS = [
  { 
    id: 'rx1', patientId: '2', patientName: 'Suhaim', date: '2025-11-12', 
    diagnosis: 'A/C URTICARIA', notes: 'cf nill', isTapering: false, 
    vitals: { bp: 'd', hr: 'd', temp: '6F', spo2: 'd', weight: 'd' }, 
    medicines: [
      { id: 'm1', name: 'PROLOMET 25MG', strength: '25 mg', dosage: 'TAB', frequency: '0-0-1', duration: '1 Day', instructions: '1/2 RESPULE + 3ML NS' }
    ], 
    proceduresPerformed: [], templateName: 'Custom' 
  },
];
const INITIAL_TEMPLATES = [{ id: 'template-none', name: 'None', diagnosis: '', medicines: [] }];
const INITIAL_PROCEDURES = [
  { id: 'p1', patientId: '6927DAF9', patientName: 'Shayla', procedureName: 'Dressing', date: '2025-12-01', cost: '500', notes: 'Wound cleaning' }
];

const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
const FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QID', '0-0-1', '1-0-1', '0-1-1', 'SOS'];
const DURATION_OPTIONS = ['3 Days', '5 Days', '7 Days', '15 Days', '1 Month', 'Continue'];

const LoadingOverlay = ({ visible }) => (
  <Modal transparent={true} animationType="fade" visible={visible}>
    <View style={styles.loaderOverlay}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Please Wait...</Text>
      </View>
    </View>
  </Modal>
);

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

  const navigate = (screen, data = null) => { setIsLoading(true); setTimeout(() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSelectedData(data); setCurrentScreen(screen); setDrawerOpen(false); setIsLoading(false); }, 300); };
  
  // Handlers
  const handleLogin = (u, p) => { setIsLoading(true); setTimeout(() => { if (u === '1' && p === '1') { navigate(Screens.DASHBOARD); } else { Alert.alert("Error", "Invalid Login"); setIsLoading(false); } }, 1000); };
  
  const handleSavePatient = (p, appt) => {
    let saved = p;
    if (!p.id) saved = { ...p, id: Date.now().toString().slice(-8).toUpperCase() }; // Gen short ID like 6927DAF9
    if (p.id) setPatients(patients.map(x => x.id === p.id ? p : x));
    else setPatients([...patients, saved]);
    navigate(Screens.PATIENT_LIST);
  };

  const handleSaveRx = (rx) => {
    const p = patients.find(pat => pat.id === rx.patientId);
    const newRx = { ...rx, id: rx.id || 'rx_' + Date.now(), patientName: p.name, date: new Date().toLocaleDateString('en-CA') };
    if (rx.id) setPrescriptions(prescriptions.map(x => x.id === rx.id ? newRx : x));
    else setPrescriptions([newRx, ...prescriptions]);
    
    // Save Procedures if any
    if (rx.proceduresPerformed.length > 0) {
      const newProcs = rx.proceduresPerformed.map(proc => ({
        id: 'proc_' + Date.now() + Math.random(),
        patientId: p.id,
        patientName: p.name,
        procedureName: proc.name,
        date: newRx.date,
        cost: proc.cost,
        notes: 'Via Prescription'
      }));
      setProcedures([...newProcs, ...procedures]);
    }
    navigate(Screens.RX_HISTORY, p);
  };

  const renderContent = () => {
    switch (currentScreen) {
      case Screens.LOGIN: return <LoginScreen onLogin={handleLogin} />;
      case Screens.DASHBOARD: return <Dashboard patients={patients} appointments={appointments} inventory={inventory} navigate={navigate} openDrawer={() => setDrawerOpen(true)} />;
      case Screens.PATIENT_LIST: return <PatientList patients={patients} navigate={navigate} onDelete={id => setPatients(patients.filter(p=>p.id!==id))} onEdit={p => navigate(Screens.ADD_PATIENT, p)} />;
      case Screens.ADD_PATIENT: return <PatientForm initialData={selectedData} onSave={handleSavePatient} onCancel={() => navigate(Screens.PATIENT_LIST)} />;
      case Screens.PATIENT_DETAILS: return <PatientDetails patient={selectedData} labs={labs} navigate={navigate} />;
      case Screens.RX_HISTORY: return <PrescriptionHistoryScreen patient={selectedData} prescriptions={prescriptions.filter(r => r.patientId === selectedData.id)} navigate={navigate} onDeleteRx={id => setPrescriptions(prescriptions.filter(r=>r.id!==id))} onEditRx={rx => navigate(Screens.ADD_RX, { ...rx, isEdit: true, patient: selectedData })} />;
      case Screens.ADD_RX: return <NewPrescriptionForm patient={selectedData.isEdit ? selectedData.patient : selectedData} inventory={inventory} templates={rxTemplates} onSave={handleSaveRx} onCancel={() => navigate(Screens.RX_HISTORY, selectedData.isEdit ? selectedData.patient : selectedData)} initialData={selectedData.isEdit ? selectedData : null} />;
      case Screens.PROCEDURES_HISTORY: return <ProceduresHistoryScreen procedures={procedures} navigate={navigate} onDelete={id => setProcedures(procedures.filter(p=>p.id!==id))} onEdit={p => navigate(Screens.ADD_PROCEDURE, p)} />;
      case Screens.ADD_PROCEDURE: return <AddProcedureForm initialData={selectedData} patients={patients} onSave={(p) => { if(p.id) setProcedures(procedures.map(x=>x.id===p.id?p:x)); else setProcedures([{...p, id:'p'+Date.now()}, ...procedures]); navigate(Screens.PROCEDURES_HISTORY); }} onCancel={()=>navigate(Screens.PROCEDURES_HISTORY)} />;
      case Screens.INVENTORY: return <InventoryScreen inventory={inventory} navigate={navigate} onUpdate={(inv) => setInventory(inv)} />;
      default: return <Dashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <LoadingOverlay visible={isLoading} />
      {renderContent()}
      {drawerOpen && <Drawer navigate={navigate} close={() => setDrawerOpen(false)} />}
    </SafeAreaView>
  );
}

// --- SUB COMPONENTS ---

const LoginScreen = ({ onLogin }) => (
  <View style={styles.loginContainer}>
    <View style={styles.loginCard}>
      <View style={styles.logoBubble}><FontAwesome5 name="hospital-user" size={40} color="#FFF" /></View>
      <Text style={styles.loginTitle}>Dr. Login</Text>
      <TextInput placeholder="Username" style={styles.inputBox} defaultValue="1" onChangeText={()=>{}} />
      <TextInput placeholder="Password" style={styles.inputBox} secureTextEntry={true} defaultValue="1" onChangeText={()=>{}} />
      <TouchableOpacity style={styles.btnPrimary} onPress={() => onLogin('1', '1')}><Text style={styles.btnText}>LOGIN</Text></TouchableOpacity>
    </View>
  </View>
);

const Drawer = ({ navigate, close }) => (
  <View style={styles.drawerOverlay}>
    <TouchableOpacity style={{ flex: 1 }} onPress={close} />
    <View style={styles.drawer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>{DOCTOR_NAME}</Text>
        <Text style={{color:'#EEE'}}>{CLINIC_NAME}</Text>
      </View>
      <ScrollView>
        <DrawerItem icon="th-large" label="Dashboard" onPress={() => navigate(Screens.DASHBOARD)} />
        <DrawerItem icon="users" label="Patients" onPress={() => navigate(Screens.PATIENT_LIST)} />
        <DrawerItem icon="band-aid" label="Procedures History" onPress={() => navigate(Screens.PROCEDURES_HISTORY)} />
        <DrawerItem icon="capsules" label="Inventory" onPress={() => navigate(Screens.INVENTORY)} />
      </ScrollView>
    </View>
  </View>
);

const DrawerItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
    <FontAwesome5 name={icon} size={20} color={Colors.primary} style={{ width: 30 }} />
    <Text style={styles.drawerLabel}>{label}</Text>
  </TouchableOpacity>
);

const Dashboard = ({ patients, appointments, inventory, navigate, openDrawer }) => (
  <View style={styles.screenContainer}>
    <Header title="Dashboard" onMenu={openDrawer} />
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={styles.gridContainer}>
        <DashboardCard title="Patients" count={patients.length} icon="users" color={Colors.dash1} onPress={() => navigate(Screens.PATIENT_LIST)} />
        <DashboardCard title="Stock" count={inventory.length} icon="capsules" color={Colors.dash3} onPress={() => navigate(Screens.INVENTORY)} />
        <DashboardCard title="Procedures" count="View" icon="band-aid" color={Colors.dash6} onPress={() => navigate(Screens.PROCEDURES_HISTORY)} />
      </View>
      <Text style={styles.sectionTitle}>Welcome, {DOCTOR_NAME}</Text>
    </ScrollView>
  </View>
);

// --- PATIENT DETAILS (NEW TEAL/YELLOW ID CARD DESIGN) ---
const PatientDetails = ({ patient, navigate }) => {
  const handleShareID = async () => {
    try { await Share.share({ message: `Patient: ${patient.name}, ID: ${patient.id}` }); } catch (e) {}
  };
  return (
    <View style={styles.screenContainer}>
      <Header title="Patient Profile" onBack={() => navigate(Screens.PATIENT_LIST)} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* NEW ID CARD DESIGN START */}
        <View style={styles.newIdCard}>
          <Text style={styles.idCardHeader}>CLINIC ID CARD</Text>
          
          <View style={styles.idBody}>
            {/* White Circle Avatar */}
            <View style={styles.idAvatarCircle}>
               <FontAwesome5 name="user-md" size={40} color="black" />
            </View>

            {/* Info */}
            <View style={styles.idInfoBox}>
              <View style={styles.idRow}><Text style={styles.idLabel}>PATIENT NAME:</Text><Text style={styles.idVal}> : {patient.name}</Text></View>
              <View style={styles.idRow}><Text style={styles.idLabel}>ID NO:</Text><Text style={styles.idVal}> : {patient.id}</Text></View>
              <View style={styles.idRow}><Text style={styles.idLabel}>AGE/GENDER:</Text><Text style={styles.idVal}> : {patient.age} Yrs / {patient.gender}</Text></View>
              <View style={styles.idRow}><Text style={styles.idLabel}>PHONE:</Text><Text style={styles.idVal}> : {patient.phone}</Text></View>
            </View>
          </View>

          {/* Yellow Divider */}
          <View style={styles.idDivider} />

          <Text style={styles.idConsultantTitle}>CONSULTANT DOCTOR:</Text>
          <Text style={styles.idDocName}>{DOCTOR_NAME}</Text>
          <Text style={styles.idClinicName}>{CLINIC_NAME}</Text>

          {/* White Footer Button */}
          <View style={styles.idFooterBtn}>
            <Text style={styles.idFooterText}>APPOINTMENT BOOKING: {CLINIC_BOOKING_NO}</Text>
          </View>
        </View>
        {/* NEW ID CARD DESIGN END */}

        <TouchableOpacity style={[styles.btnPrimary, { marginTop: 20 }]} onPress={() => navigate(Screens.RX_HISTORY, patient)}>
          <Text style={styles.btnText}>VIEW / ADD PRESCRIPTION</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// --- PRESCRIPTION HISTORY (NEW PDF DESIGN) ---
const PrescriptionHistoryScreen = ({ patient, prescriptions, navigate, onDeleteRx, onEditRx }) => {
  const handleExportPdf = async () => {
    if (prescriptions.length === 0) { Alert.alert("No Data"); return; }
    // Use the latest Rx for the print
    const rx = prescriptions[0];
    const today = new Date().toLocaleDateString('en-GB');

    // NEW PDF HTML TEMPLATE
    const html = `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, sans-serif; margin: 0; padding: 0; background-color: #fff; }
          .header { background-color: #00796B; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: bold; text-transform: uppercase; }
          .header p { margin: 4px 0; font-size: 12px; }
          .container { padding: 25px; }
          .patient-box { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          .info-left { width: 60%; }
          .info-right { width: 35%; text-align: left; }
          .label { font-weight: bold; color: #000; }
          
          .lab-report { margin-top: 15px; margin-bottom: 15px; }
          .lab-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th { background-color: #f0f0f0; border: 1px solid #ccc; padding: 6px; text-align: left; font-weight: bold; }
          td { border: 1px solid #ccc; padding: 6px; }
          
          .footer { margin-top: 50px; display: flex; justify-content: flex-end; }
          .signature { text-align: right; }
          .signature h3 { margin-bottom: 0; margin-top: 10px; }
          
          .bottom-bar { margin-top: 30px; font-size: 10px; color: #555; border-top: 1px solid #eee; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${DOCTOR_NAME}, ${DOCTOR_QUALIFICATION}</h1>
          <p>General Practitioner | Reg No: ${DOCTOR_REG_NO} | ${DOCTOR_PHONE}</p>
          <p>${CLINIC_NAME} | BOOKING NO: ${CLINIC_BOOKING_NO}</p>
        </div>
        
        <div class="container">
          <!-- Patient Info -->
          <div class="patient-box">
            <div class="info-left">
              <div style="font-weight:bold; font-size:14px; margin-bottom:5px;">Patient Information</div>
              <div><span class="label">Name:</span> ${patient.name}</div>
              <div><span class="label">Phone:</span> ${patient.phone}</div>
              <div><span class="label">Age:</span> ${patient.age}</div>
              <div><span class="label">Diagnosis:</span> ${rx.diagnosis}</div>
              <div><span class="label">Date & Time:</span> ${rx.date}, ${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="info-right">
              <div><span class="label">SpO2:</span> ${rx.vitals.spo2 || '-'}</div>
              <div><span class="label">BP:</span> ${rx.vitals.bp || '-'}</div>
              <div><span class="label">Pulse:</span> ${rx.vitals.hr || '-'}</div>
              <div><span class="label">Temp:</span> ${rx.vitals.temp || '-'}</div>
              <div><span class="label">Weight:</span> ${rx.vitals.weight || '-'}</div>
            </div>
          </div>

          <!-- Lab Report Placeholder -->
          <div class="lab-report">
            <div class="lab-title">Lab Report</div>
            <div>Report Name: -</div>
            <div>Value: -</div>
            <div>Report Date: -</div>
          </div>

          <!-- Medicines Table -->
          <div class="lab-title">Medicines</div>
          <table>
            <thead>
              <tr>
                <th style="width:30px;">Sl</th>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Type</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${rx.medicines.map((m, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><b>${m.name}</b><br/><span style="font-size:9px; color:#555;">Content: ${m.strength}</span></td>
                  <td>${m.strength}</td>
                  <td>${m.dosage}</td>
                  <td>${m.frequency}</td>
                  <td>${m.duration}</td>
                  <td>${m.instructions}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top:20px;">
             <b>Lab Tests On Next Visit</b>
             <div>• - </div>
          </div>

          <div class="footer">
            <div class="signature">
              <div>Signed by</div>
              <h3>${DOCTOR_NAME}</h3>
            </div>
          </div>
          
          <div class="bottom-bar">
            Prescription Generated by Suhaim Software<br/>
            Visit us: www.clinicppm.site
          </div>
        </div>
      </body>
    </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  return (
    <View style={styles.screenContainer}>
      <Header title="Rx History" onBack={() => navigate(Screens.PATIENT_DETAILS, patient)} onAdd={() => navigate(Screens.ADD_RX, patient)} />
      <FlatList
        data={prescriptions}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <View>
                    <Text style={styles.cardTitle}>{item.date}</Text>
                    <Text>{item.diagnosis}</Text>
                </View>
                <View style={{flexDirection:'row'}}>
                    <TouchableOpacity onPress={handleExportPdf} style={{marginRight:10}}><FontAwesome5 name="file-pdf" size={20} color={Colors.danger}/></TouchableOpacity>
                    <TouchableOpacity onPress={()=>onEditRx(item)}><FontAwesome5 name="pen" size={20} color={Colors.primary}/></TouchableOpacity>
                </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

// --- PROCEDURES HISTORY (EXCEL EXPORT) ---
const ProceduresHistoryScreen = ({ procedures, navigate, onEdit, onDelete }) => {
  const handleExportProcedures = async () => {
    if (procedures.length === 0) { Alert.alert("No Data"); return; }
    const headerString = 'Date,Patient Name,Procedure Name,Cost,Notes\n';
    const rowString = procedures.map(p => `${p.date},"${p.patientName}","${p.procedureName}",${p.cost},"${p.notes}"`).join('\n');
    const csvString = headerString + rowString;
    const fileUri = FileSystem.documentDirectory + 'procedures_report.csv';
    await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri);
  };
  const total = procedures.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);
  return (
    <View style={styles.screenContainer}>
      <Header title="Procedures History" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_PROCEDURE)} />
      <View style={{padding:20}}>
        <View style={styles.revenueCard}>
            <Text style={{color:'white'}}>Total Revenue</Text>
            <Text style={{color:'white', fontSize:24, fontWeight:'bold'}}>₹ {total}</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportProcedures}>
            <FontAwesome5 name="file-excel" size={16} color="white" />
            <Text style={{color:'white', fontWeight:'bold', marginLeft:10}}>Export Report (Excel/CSV)</Text>
        </TouchableOpacity>
      </View>
      <FlatList 
        data={procedures}
        keyExtractor={i => i.id}
        contentContainerStyle={{paddingHorizontal:20}}
        renderItem={({item}) => (
            <View style={styles.card}>
                <View style={styles.row}>
                    <View style={{flex:1}}>
                        <Text style={styles.cardTitle}>{item.procedureName}</Text>
                        <Text style={styles.cardSub}>{item.patientName} | {item.date}</Text>
                        <Text style={{fontWeight:'bold', color:Colors.primary}}>₹ {item.cost}</Text>
                    </View>
                    <TouchableOpacity onPress={()=>onDelete(item.id)}><FontAwesome5 name="trash" size={16} color={Colors.danger}/></TouchableOpacity>
                </View>
            </View>
        )}
      />
    </View>
  );
};

// --- NEW PRESCRIPTION FORM (POP DESIGN) ---
const NewPrescriptionForm = ({ patient, inventory, templates, onSave, onCancel, initialData }) => {
  const isEdit = !!initialData;
  const [rxData, setRxData] = useState(initialData || {
    patientId: patient.id, diagnosis: '', notes: '', isTapering: false,
    vitals: patient.vitals || {}, medicines: [], proceduresPerformed: [], templateId: 'template-none', taperingPlan: []
  });
  const [currentMed, setCurrentMed] = useState({ name: '', strength: '', dosage: 'Tablet', frequency: 'OD', duration: '3 Days', instructions: '' });
  const [currentProc, setCurrentProc] = useState({ name: '', cost: '' });
  const [currentTaper, setCurrentTaper] = useState({ stage: '', duration: '', dose: '' });

  useEffect(() => {
    const t = templates.find(temp => temp.id === rxData.templateId);
    if(t && t.id !== 'template-none') setRxData({...rxData, diagnosis: t.diagnosis, medicines: t.medicines});
  }, [rxData.templateId]);

  const addMed = () => {
    if(!currentMed.name) return;
    setRxData({...rxData, medicines: [...rxData.medicines, {...currentMed, id: Date.now()}]});
    setCurrentMed({ name: '', strength: '', dosage: 'Tablet', frequency: 'OD', duration: '3 Days', instructions: '' });
  };
  const addProc = () => {
    if(!currentProc.name) return;
    setRxData({...rxData, proceduresPerformed: [...rxData.proceduresPerformed, {...currentProc, id: Date.now()}]});
    setCurrentProc({name:'', cost:''});
  };
  const addTaper = () => {
    if(!currentTaper.stage) return;
    setRxData({...rxData, taperingPlan: [...rxData.taperingPlan, {...currentTaper, id: Date.now()}]});
    setCurrentTaper({stage:'', duration:'', dose:''});
  };

  return (
    <View style={styles.screenContainer}>
      <Header title="New Prescription" onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.popCard}>
            <Text style={styles.label}>Template & Notes</Text>
            <View style={styles.inputBox}>
                <Picker selectedValue={rxData.templateId} onValueChange={v => setRxData({...rxData, templateId: v})}>
                    {templates.map(t => <Picker.Item key={t.id} label={t.name} value={t.id} />)}
                </Picker>
            </View>
            <TextInput style={[styles.inputBox, {marginTop:10}]} placeholder="Diagnosis" value={rxData.diagnosis} onChangeText={t => setRxData({...rxData, diagnosis: t})} />
            <TextInput style={[styles.inputBox, {marginTop:10}]} placeholder="Doctor's Notes" value={rxData.notes} onChangeText={t => setRxData({...rxData, notes: t})} />
        </View>

        <Text style={styles.sectionTitle}>Prescribed Medicines ({rxData.medicines.length})</Text>
        {rxData.medicines.map((m, i) => (
             <View key={i} style={styles.medItem}><Text style={{fontWeight:'bold'}}>{m.name}</Text><Text>{m.frequency} - {m.duration}</Text></View>
        ))}
        
        <View style={styles.popCard}>
            <Text style={styles.subHeader}>Add New Medicine</Text>
            <TextInput style={styles.inputBox} placeholder="Medicine Name" value={currentMed.name} onChangeText={t => setCurrentMed({...currentMed, name: t})} />
            <View style={styles.row}>
                <TextInput style={[styles.inputBox, {flex:1, marginRight:5}]} placeholder="Strength" value={currentMed.strength} onChangeText={t => setCurrentMed({...currentMed, strength: t})} />
                <View style={[styles.inputBox, {flex:1}]}>
                    <Picker selectedValue={currentMed.dosage} onValueChange={v=>setCurrentMed({...currentMed, dosage: v})}>
                        {['Tablet','Syrup','Capsule','Injection'].map(i=><Picker.Item key={i} label={i} value={i}/>)}
                    </Picker>
                </View>
            </View>
            <View style={styles.row}>
                <View style={[styles.inputBox, {flex:1, marginRight:5}]}>
                     <Picker selectedValue={currentMed.frequency} onValueChange={v=>setCurrentMed({...currentMed, frequency: v})}>
                        {FREQUENCY_OPTIONS.map(i=><Picker.Item key={i} label={i} value={i}/>)}
                    </Picker>
                </View>
                <View style={[styles.inputBox, {flex:1}]}>
                     <Picker selectedValue={currentMed.duration} onValueChange={v=>setCurrentMed({...currentMed, duration: v})}>
                        {DURATION_OPTIONS.map(i=><Picker.Item key={i} label={i} value={i}/>)}
                    </Picker>
                </View>
            </View>
            <TextInput style={[styles.inputBox, {marginTop:5}]} placeholder="Specific Instructions" value={currentMed.instructions} onChangeText={t => setCurrentMed({...currentMed, instructions: t})} />
            <TouchableOpacity style={styles.btnSmall} onPress={addMed}><Text style={{color:'white'}}>ADD MEDICINE</Text></TouchableOpacity>
        </View>

        <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:20}}>
            <Text style={styles.sectionTitle}>Tapering Plan</Text>
            <TouchableOpacity onPress={()=>setRxData({...rxData, isTapering: !rxData.isTapering})}><FontAwesome5 name={rxData.isTapering ? "toggle-on" : "toggle-off"} size={24} color={rxData.isTapering?Colors.primary:'grey'}/></TouchableOpacity>
        </View>
        {rxData.isTapering && (
            <View style={styles.popCard}>
                 <Text style={{fontStyle:'italic', color:'grey', marginBottom:10}}>Use tapering when dose/frequency gradually changes.</Text>
                 {rxData.taperingPlan.map((t,i) => <Text key={i}>{t.stage}: {t.dose} for {t.duration}</Text>)}
                 <TextInput style={[styles.inputBox, {marginTop:10}]} placeholder="Stage/Instruction (e.g. Week 1)" value={currentTaper.stage} onChangeText={t=>setCurrentTaper({...currentTaper, stage:t})} />
                 <View style={styles.row}>
                    <TextInput style={[styles.inputBox, {flex:1, marginRight:5}]} placeholder="Duration" value={currentTaper.duration} onChangeText={t=>setCurrentTaper({...currentTaper, duration:t})} />
                    <TextInput style={[styles.inputBox, {flex:1}]} placeholder="Dose" value={currentTaper.dose} onChangeText={t=>setCurrentTaper({...currentTaper, dose:t})} />
                 </View>
                 <TouchableOpacity style={styles.btnSmall} onPress={addTaper}><Text style={{color:'white'}}>ADD STEP</Text></TouchableOpacity>
            </View>
        )}

        <Text style={styles.sectionTitle}>Procedures Performed ({rxData.proceduresPerformed.length})</Text>
        <View style={styles.popCard}>
            <Text style={styles.subHeader}>Add Procedure</Text>
            <TextInput style={styles.inputBox} placeholder="Procedure Name" value={currentProc.name} onChangeText={t => setCurrentProc({...currentProc, name: t})} />
            <TextInput style={[styles.inputBox, {marginTop:5}]} placeholder="Cost" keyboardType="numeric" value={currentProc.cost} onChangeText={t => setCurrentProc({...currentProc, cost: t})} />
            <TouchableOpacity style={[styles.btnSmall, {backgroundColor:Colors.dash6}]} onPress={addProc}><Text style={{color:'white'}}>ADD PROCEDURE</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={()=>onSave(rxData)}><Text style={styles.btnText}>SAVE PRESCRIPTION</Text></TouchableOpacity>
        <View style={{height:50}}/>
      </ScrollView>
    </View>
  );
};

// --- GENERIC COMPONENTS ---
const Header = ({ title, onMenu, onBack, onAdd }) => (
  <View style={styles.header}>
    {onMenu && <TouchableOpacity onPress={onMenu}><MaterialIcons name="menu" size={28} color="#FFF" /></TouchableOpacity>}
    {onBack && <TouchableOpacity onPress={onBack}><MaterialIcons name="arrow-back" size={28} color="#FFF" /></TouchableOpacity>}
    <Text style={styles.headerTitle}>{title}</Text>
    {onAdd ? <TouchableOpacity onPress={onAdd}><MaterialIcons name="add" size={28} color="#FFF" /></TouchableOpacity> : <View style={{width:28}}/>}
  </View>
);

const DashboardCard = ({ title, count, icon, color, onPress }) => (
  <TouchableOpacity style={styles.gridCard} onPress={onPress}>
    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}><FontAwesome5 name={icon} size={24} color={color} /></View>
    <Text style={styles.gridCount}>{count}</Text>
    <Text style={styles.gridTitle}>{title}</Text>
  </TouchableOpacity>
);

const PatientList = ({patients, navigate, onDelete, onEdit}) => (
    <View style={styles.screenContainer}>
        <Header title="Patients" onBack={()=>navigate(Screens.DASHBOARD)} onAdd={()=>navigate(Screens.ADD_PATIENT)}/>
        <FlatList data={patients} keyExtractor={i=>i.id} renderItem={({item})=>(
            <View style={styles.card}>
                <TouchableOpacity style={styles.row} onPress={()=>navigate(Screens.PATIENT_DETAILS, item)}>
                    <View style={{width:40,height:40,borderRadius:20,backgroundColor:'#EEE',justifyContent:'center',alignItems:'center'}}><Text>{item.name[0]}</Text></View>
                    <View style={{marginLeft:10, flex:1}}><Text style={styles.cardTitle}>{item.name}</Text><Text>{item.phone}</Text></View>
                </TouchableOpacity>
            </View>
        )}/>
    </View>
);

const PatientForm = ({initialData, onSave, onCancel}) => {
    const [p, setP] = useState(initialData || {name:'', age:'', gender:'Female', phone:'', vitals:{bp:'', weight:''}});
    return (
        <View style={styles.screenContainer}>
            <Header title="Patient Form" onBack={onCancel}/>
            <ScrollView style={{padding:20}}>
                <TextInput style={styles.inputBox} placeholder="Name" value={p.name} onChangeText={t=>setP({...p, name:t})}/>
                <TextInput style={[styles.inputBox,{marginTop:10}]} placeholder="Age" value={p.age} onChangeText={t=>setP({...p, age:t})}/>
                <TextInput style={[styles.inputBox,{marginTop:10}]} placeholder="Phone" value={p.phone} onChangeText={t=>setP({...p, phone:t})}/>
                <View style={[styles.inputBox, {marginTop:10}]}>
                    <Picker selectedValue={p.gender} onValueChange={v=>setP({...p, gender:v})}>
                        <Picker.Item label="Female" value="Female"/><Picker.Item label="Male" value="Male"/>
                    </Picker>
                </View>
                <TouchableOpacity style={styles.btnPrimary} onPress={()=>onSave(p)}><Text style={styles.btnText}>SAVE</Text></TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const AddProcedureForm = ({initialData, patients, onSave, onCancel}) => {
    const [p, setP] = useState(initialData || {patientId: patients[0]?.id, procedureName:'', cost:'', date: new Date().toLocaleDateString('en-CA'), notes:''});
    return (
        <View style={styles.screenContainer}>
            <Header title="Procedure Record" onBack={onCancel}/>
            <ScrollView style={{padding:20}}>
                <View style={styles.inputBox}>
                    <Picker selectedValue={p.patientId} onValueChange={v=>{
                        const pat = patients.find(px=>px.id===v);
                        setP({...p, patientId:v, patientName: pat.name});
                    }}>
                        {patients.map(pat=><Picker.Item key={pat.id} label={pat.name} value={pat.id}/>)}
                    </Picker>
                </View>
                <TextInput style={[styles.inputBox, {marginTop:10}]} placeholder="Procedure Name" value={p.procedureName} onChangeText={t=>setP({...p, procedureName:t})}/>
                <TextInput style={[styles.inputBox, {marginTop:10}]} placeholder="Cost" keyboardType="numeric" value={p.cost} onChangeText={t=>setP({...p, cost:t})}/>
                <TextInput style={[styles.inputBox, {marginTop:10}]} placeholder="Notes" value={p.notes} onChangeText={t=>setP({...p, notes:t})}/>
                <TouchableOpacity style={styles.btnPrimary} onPress={()=>onSave(p)}><Text style={styles.btnText}>SAVE</Text></TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const InventoryScreen = ({inventory}) => (
    <View style={styles.screenContainer}>
        <Header title="Inventory" />
        <FlatList data={inventory} keyExtractor={i=>i.id} renderItem={({item})=>(
            <View style={styles.card}><Text style={styles.cardTitle}>{item.name}</Text><Text>Stock: {item.stock}</Text></View>
        )}/>
    </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  screenContainer: { flex: 1, backgroundColor: Colors.bg },
  header: { height: 70, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, elevation: 5, paddingTop:15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 15, alignItems: 'center', elevation: 3 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridCount: { fontSize: 22, fontWeight: 'bold' },
  gridTitle: { color: Colors.subText },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, color: Colors.primaryDark },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
  btnPrimary: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  inputBox: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10 },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary },
  loginCard: { width: '85%', backgroundColor: '#FFF', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 10 },
  logoBubble: { width: 80, height: 80, backgroundColor: Colors.primary, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: Colors.primary },
  
  // ID CARD STYLES (Specific Teal/Yellow Design)
  newIdCard: { backgroundColor: Colors.idCardBg, borderRadius: 10, overflow: 'hidden', elevation: 5, paddingBottom: 20 },
  idCardHeader: { textAlign: 'center', color: '#FFF', fontWeight: 'bold', fontSize: 18, marginTop: 15, marginBottom: 15, letterSpacing: 2 },
  idBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  idAvatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  idInfoBox: { flex: 1 },
  idRow: { flexDirection: 'row', marginBottom: 5 },
  idLabel: { color: '#B2DFDB', fontWeight: 'bold', width: 100, fontSize: 12 },
  idVal: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  idDivider: { height: 2, backgroundColor: Colors.idCardLine, marginHorizontal: 20, marginVertical: 15 },
  idConsultantTitle: { textAlign: 'center', color: '#B2DFDB', fontSize: 10, marginBottom: 2 },
  idDocName: { textAlign: 'center', color: '#FFF', fontSize: 20, fontWeight: 'bold', fontStyle: 'italic' },
  idClinicName: { textAlign: 'center', color: Colors.idCardLine, fontSize: 14, fontWeight: 'bold', marginBottom: 20 },
  idFooterBtn: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 12, borderRadius: 8, alignItems: 'center' },
  idFooterText: { color: '#004D40', fontWeight: 'bold', fontSize: 12 },

  // Pop Style Forms
  popCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, elevation: 4, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: Colors.primary },
  subHeader: { fontWeight: 'bold', marginBottom: 10, color: Colors.primary },
  btnSmall: { backgroundColor: Colors.primary, padding: 8, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  medItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#E0F2F1', marginBottom: 5, borderRadius: 5 },
  revenueCard: { backgroundColor: Colors.dash6, padding: 20, borderRadius: 15, marginBottom: 15 },
  exportBtn: { flexDirection: 'row', backgroundColor: Colors.primary, padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  drawerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  drawer: { width: '75%', backgroundColor: '#FFF', height: '100%' },
  drawerHeader: { backgroundColor: Colors.primary, padding: 20, paddingTop: 40 },
  drawerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  drawerItem: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  drawerLabel: { fontSize: 16, marginLeft: 15 },
});