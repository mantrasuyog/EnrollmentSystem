import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Alert,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  TextInput,
  Animated as RNAnimated,
  Image,
} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import DocumentReader, {
  Enum,
  DocumentReaderCompletion,
  RNRegulaDocumentReader,
  DocumentReaderResults,
  DocumentReaderNotification,
  ScannerConfig,
  RecognizeConfig,
  DocReaderConfig,
  Functionality,
} from '@regulaforensics/react-native-document-reader-api';
import * as RNFS from 'react-native-fs';
import {launchImageLibrary} from 'react-native-image-picker';
import ScanData from '../common/GlobalScanData';
import {connect} from 'react-redux';
import {addScanData, clearScanData} from '../redux/scanSlice';
import {AppDispatch, RootState} from '../redux/store';
import {NativeEventEmitter} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../common/colors';

import DocumentCard from '../components/DocumentCard';
import PortraitCard from '../components/PortraitCard';
import ActionButton from '../components/ActionButton';
import InfoBadge from '../components/InfoBadge';
import CentreCodeDisplay from '../components/CentreCodeDisplay';
import ScanLoader from '../components/ScanLoader';
import DocumentHeader from '../components/DocumentHeader';
import ValidationModal from '../components/ValidationModal';
import ExistingDocumentModal from '../components/ExistingDocumentModal';

import {useAnimations} from '../hooks/useAnimations';

const {height} = Dimensions.get('window');

interface IProps {
  navigation?: NavigationProp<any>;
  addScanData: (data: any) => void;
  clearScanData: () => void;
  onSubmitSuccess?: () => void;
  scanData?: any[];
}

const DocumentUploadScreen: React.FC<IProps> = ({
  navigation,
  addScanData,
  clearScanData,
  onSubmitSuccess,
  scanData,
}) => {
  
  const [fullName, setFullName] = useState<string>('Ready');
  const [portrait, setPortrait] = useState(
    require('../assets/images/portrait.png'),
  );
  const [docFront, setDocFront] = useState(require('../assets/images/id.png'));
  const [allTextFields, setAllTextFields] = useState<any[]>([]);
  const [isCentreCodeEntered, setIsCentreCodeEntered] = useState(false);
  const [enteredCentreCode, setEnteredCentreCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showCentreCodeModal, setShowCentreCodeModal] = useState(false);
  const [centreCodeInput, setCentreCodeInput] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState(
    'Details Not Found',
  );
  const [showDocumentZoomModal, setShowDocumentZoomModal] = useState(false);
  const [showExistingDocumentModal, setShowExistingDocumentModal] = useState(false);
  const [canRfid, setCanRfid] = useState(false);
  const [doRfid, setDoRfid] = useState(false);
  const [isReadingRfidCustomUi, setIsReadingRfidCustomUi] = useState(false);
  const [rfidUIHeader, setRfidUIHeader] = useState('Reading RFID');
  const [rfidUIHeaderColor, setRfidUIHeaderColor] = useState('black');
  const [rfidDescription, setRfidDescription] = useState('');
  const [rfidProgress, setRfidProgress] = useState(-1);

  const scanProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReadingRfid = useRef(false);

  const animations = useAnimations();

  useEffect(() => {
    initializeDocumentReader();
    loadImagesFromRedux();
  }, []);

  useEffect(() => {
    loadImagesFromRedux();
  }, [scanData]);

  useEffect(() => {
    return () => {
      if (scanProgressInterval.current) {
        clearInterval(scanProgressInterval.current);
      }
    };
  }, []);

  const initializeDocumentReader = useCallback(() => {
    const eventManager = new NativeEventEmitter(RNRegulaDocumentReader);

    eventManager.addListener('completion', e =>
      handleCompletion(
        DocumentReaderCompletion.fromJson(JSON.parse(e['msg']))!,
      ),
    );

    eventManager.addListener('rfidOnProgressCompletion', e =>
      updateRfidUI(
        DocumentReaderNotification.fromJson(JSON.parse(e['msg']))!,
      ),
    );

    const licPath =
      Platform.OS === 'ios'
        ? RNFS.MainBundlePath + '/regula.license'
        : 'regula.license';
    const readFile = Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets;

    readFile(licPath, 'base64').then(res => {
      setFullName('Initializing...');
      const config = new DocReaderConfig();
      config.license = res;
      config.delayedNNLoad = true;

      DocumentReader.initializeReader(
        config,
        response => {
          if (!JSON.parse(response)['success']) {
            console.log(response);
            return;
          }

          DocumentReader.getIsRFIDAvailableForUse(
            canRfid => {
              if (canRfid) {
                setCanRfid(true);
                setRfidUIHeader('Reading RFID');
                setRfidDescription('Place your phone on top of the NFC tag');
                setRfidUIHeaderColor('black');
              }
            },
            error => console.log(error),
          );

          setFullName('Ready');
          onInitialized();
        },
        error => console.log(error),
      );
    });
  }, []);

  const onInitialized = useCallback(() => {
    const functionality = new Functionality();
    functionality.showCaptureButton = true;
    DocumentReader.setFunctionality(
      functionality,
      _ => {},
      _ => {},
    );
  }, []);

  const loadImagesFromRedux = useCallback(() => {
    if (scanData && scanData.length > 0) {
      const latestScan = scanData[0];

      if (latestScan.Document_Image) {
        const docImageUri = latestScan.Document_Image.startsWith('data:image')
          ? latestScan.Document_Image
          : 'data:image/png;base64,' + latestScan.Document_Image;
        setDocFront({uri: docImageUri});
      } else {
        setDocFront(require('../assets/images/id.png'));
      }

      if (latestScan.Portrait_Image) {
        const portraitImageUri = latestScan.Portrait_Image.startsWith(
          'data:image',
        )
          ? latestScan.Portrait_Image
          : 'data:image/png;base64,' + latestScan.Portrait_Image;
        setPortrait({uri: portraitImageUri});
      } else {
        setPortrait(require('../assets/images/portrait.png'));
      }
    } else {
      setDocFront(require('../assets/images/id.png'));
      setPortrait(require('../assets/images/portrait.png'));
    }
  }, [scanData]);

  const startScanProgress = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);
    animations.startLoaderAnimation();

    scanProgressInterval.current = setInterval(() => {
      setScanProgress(prev => Math.min(prev + Math.random() * 0.3, 0.9));
    }, 500);
  }, [animations]);

  const stopScanProgress = useCallback(() => {
    if (scanProgressInterval.current) {
      clearInterval(scanProgressInterval.current);
    }
    animations.stopLoaderAnimation();
    setIsScanning(false);
    setScanProgress(0);
  }, [animations]);

  const handleButtonPress = useCallback(() => {

  }, []);

  const areImagesUploaded = useCallback(() => {
    const portraitUploaded =
      typeof portrait === 'object' && 'uri' in portrait && portrait.uri !== undefined;
    const documentUploaded =
      typeof docFront === 'object' && 'uri' in docFront && docFront.uri !== undefined;
    return portraitUploaded && documentUploaded;
  }, [portrait, docFront]);

  const showErrorModalFn = useCallback((message: string = 'Details Not Found') => {
    setShowErrorModal(true);
    setErrorModalMessage(message);
  }, []);

  const handleSubmitButtonPress = useCallback(() => {
    if (!areImagesUploaded()) {
      showErrorModalFn('Please upload both document and portrait images before proceeding');
      return;
    }

    // Check if scan data exists in Redux
    if (!scanData || scanData.length === 0) {
      showErrorModalFn('Document details not found. Please scan the document first.');
      return;
    }

    // Check if required document details are present
    const latestScan = scanData[0];
    if (!latestScan.Document_Image || !latestScan.Portrait_Image) {
      showErrorModalFn('Document and portrait images are required to proceed with enrollment.');
      return;
    }

    // Navigate to Face and Finger Enrollment screen
    if (onSubmitSuccess) {
      onSubmitSuccess();
    } else if (navigation) {
      navigation.navigate('FaceAndFingerEnrollment');
    }
  }, [navigation, onSubmitSuccess, areImagesUploaded, scanData, showErrorModalFn]);

  const handleCompletion = useCallback(
    (completion: DocumentReaderCompletion) => {
      stopScanProgress();

      if (isReadingRfidCustomUi) {
        if (completion.action === Enum.DocReaderAction.ERROR) {
          restartRfidUI();
        }
        if (
          actionSuccess(completion.action!) ||
          actionError(completion.action!)
        ) {
          hideRfidUI();
          displayResults(completion.results!);
        }
      } else if (
        actionSuccess(completion.action!) ||
        actionError(completion.action!)
      ) {
        handleResults(completion.results!);
      }
    },
    [isReadingRfidCustomUi, stopScanProgress],
  );

  const actionSuccess = useCallback((action: number) => {
    return (
      action === Enum.DocReaderAction.COMPLETE ||
      action === Enum.DocReaderAction.TIMEOUT
    );
  }, []);

  const actionError = useCallback((action: number) => {
    return (
      action === Enum.DocReaderAction.CANCEL ||
      action === Enum.DocReaderAction.ERROR
    );
  }, []);

  const isResultsValid = useCallback((results: DocumentReaderResults) => {
    if (!results) return false;

    let hasValidData = false;

    if (
      results.textResult &&
      results.textResult.fields &&
      results.textResult.fields.length > 0
    ) {
      hasValidData = true;
    }

    if (
      results.graphicResult &&
      results.graphicResult.fields &&
      results.graphicResult.fields.length > 0
    ) {
      hasValidData = true;
    }

    return hasValidData;
  }, []);

  const displayResults = useCallback(
    (results: DocumentReaderResults) => {
      if (!isResultsValid(results)) {
        showErrorModalFn(
          'No details found. Please:\n\n• Ensure document is in frame\n• Check document quality (HD)\n• Avoid glare and shadows\n\nTry scanning again.',
        );
        return;
      }

      results.textFieldValueByType(
        Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES,
        (value: string | undefined) => {
          setFullName(value || 'Document Scanned');
          ScanData.setName(value || '');
        },
        (error: string) => console.log(error),
      );

      results.graphicFieldImageByType(
        Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE,
        (value: string | undefined) => {
          if (value != null && value !== '') {
            setDocFront({uri: 'data:image/png;base64,' + value});
            ScanData.setDocument('data:image/png;base64,' + value);
          }
        },
        (error: string) => console.log(error),
      );

      results.graphicFieldImageByType(
        Enum.eGraphicFieldType.GF_PORTRAIT,
        (value: string | undefined) => {
          if (value != null && value !== '') {
            setPortrait({uri: 'data:image/png;base64,' + value});
            ScanData.setPortrait('data:image/png;base64,' + value);
          }
        },
        (error: string) => console.log(error),
      );

      let fields: any[] = [];
      if (results.textResult && results.textResult.fields) {
        results.textResult.fields.forEach(f => {
          fields.push({
            name: f.fieldName,
            value: f.value,
          });
        });
      }

      if (fields.length === 0) {
        showErrorModalFn(
          'Insufficient data extracted. Please:\n\n• Ensure document is in frame\n• Check document quality (HD)\n• Avoid glare and shadows\n\nTry scanning again.',
        );
        return;
      }

      setAllTextFields(fields);
      setShowCentreCodeModal(true);
      setCentreCodeInput('');
    },
    [isResultsValid, showErrorModalFn],
  );

  const handleResults = useCallback(
    (results: DocumentReaderResults) => {
      if (
        doRfid &&
        !isReadingRfid.current &&
        results != null &&
        results.chipPage !== 0
      ) {
        usualRFID();
      } else {
        isReadingRfid.current = false;
        displayResults(results);
      }
    },
    [doRfid, displayResults],
  );

  const restartRfidUI = useCallback(() => {
    setRfidUIHeaderColor('red');
    setRfidUIHeader('Failed!');
    setRfidDescription('Place your phone on top of the NFC tag');
    setRfidProgress(-1);
  }, []);

  const hideRfidUI = useCallback(() => {
    DocumentReader.stopRFIDReader(
      _ => {},
      _ => {},
    );
    restartRfidUI();
    setIsReadingRfidCustomUi(false);
    setRfidUIHeader('Reading RFID');
    setRfidUIHeaderColor('black');
  }, [restartRfidUI]);

  const showRfidUI = useCallback(() => {
    setIsReadingRfidCustomUi(true);
  }, []);

  const customRFID = useCallback(() => {
    showRfidUI();
    DocumentReader.readRFID(
      false,
      false,
      false,
      _ => {},
      _ => {},
    );
  }, [showRfidUI]);

  const usualRFID = useCallback(() => {
    isReadingRfid.current = true;
    DocumentReader.startRFIDReader(
      false,
      false,
      false,
      _ => {},
      _ => {},
    );
  }, []);

  const updateRfidUI = useCallback(
    (notification: DocumentReaderNotification) => {
      if (
        notification.notificationCode ===
        Enum.eRFID_NotificationCodes.RFID_NOTIFICATION_PCSC_READING_DATAGROUP
      ) {
        setRfidDescription('ERFIDDataFileType: ' + notification.dataFileType);
      }
      setRfidUIHeader('Reading RFID');
      setRfidUIHeaderColor('black');
      if (notification.progress != null) {
        setRfidProgress(notification.progress / 100);
      }
      if (Platform.OS === 'ios') {
        DocumentReader.setRfidSessionStatus(
          rfidDescription + '\n' + notification.progress + '%',
          e => {},
          e => {},
        );
      }
    },
    [rfidDescription],
  );

  const clearResults = useCallback(() => {
    setFullName('Ready');
    setDocFront(require('../assets/images/id.png'));
    setPortrait(require('../assets/images/portrait.png'));
  }, []);

  const deleteDocuments = useCallback(() => {
    setShowDeleteConfirmModal(false);

    setTimeout(() => {
      clearResults();
      clearScanData();
      setIsCentreCodeEntered(false);
      setEnteredCentreCode('');
      setCentreCodeInput('');
      setAllTextFields([]);
      setFullName('Ready');
    }, 300);
  }, [clearResults, clearScanData]);

  const scan = useCallback(() => {
    handleButtonPress();
    setShowActionModal(false);

    setTimeout(() => {
      clearResults();
      const config = new ScannerConfig();
      config.scenario = 'FullProcess';
      DocumentReader.startScanner(
        config,
        _ => {},
        e => {
          console.log(e);
          stopScanProgress();
        },
      );
    }, 300);
  }, [handleButtonPress, clearResults, stopScanProgress]);

  const recognize = useCallback(() => {
    handleButtonPress();
    setShowActionModal(false);

    setTimeout(() => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          includeBase64: true,
          selectionLimit: 10,
        },
        r => {
          if (r.errorCode != null) {
            console.log('error code: ' + r.errorCode);
            console.log('error message: ' + r.errorMessage);
            setFullName(r.errorMessage || 'Error');
            return;
          }
          if (r.didCancel) return;

          clearResults();
          startScanProgress();
          const response = r.assets;

          const images: any = [];
          for (let i = 0; i < response!.length; i++) {
            images.push(response![i].base64!);
          }

          const config = new RecognizeConfig();
          config.scenario = 'FullProcess';
          config.images = images;
          DocumentReader.recognize(
            config,
            _ => {},
            e => {
              console.log(e);
              stopScanProgress();
            },
          );
        },
      );
    }, 300);
  }, [handleButtonPress, clearResults, startScanProgress, stopScanProgress]);

  const generateCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const createScannedData = useCallback(
    (centreCode: string) => {
      return {
        Registration_Number: generateCode(),
        Centre_Code: centreCode,
        Name: ScanData.Name,
        Portrait_Image: ScanData.Portrait_Image,
        Document_Image: ScanData.Document_Image,
        scanned_json: JSON.stringify(allTextFields || []),
      };
    },
    [allTextFields, generateCode],
  );

  const handleCentreCodeSubmit = useCallback(() => {
    if (centreCodeInput.trim() === '') {
      Alert.alert('Error', 'Please enter Centre Code');
      return;
    }

    if (centreCodeInput.length < 4) {
      Alert.alert('Error', 'Centre Code must be at least 4 characters');
      return;
    }

    setShowCentreCodeModal(false);

    setTimeout(() => {
      const finalData = createScannedData(centreCodeInput);
      clearScanData();
      addScanData(finalData);
      setIsCentreCodeEntered(true);
      setEnteredCentreCode(centreCodeInput);
    }, 500);
  }, [centreCodeInput, createScannedData, clearScanData, addScanData]);

  const openDocumentZoom = useCallback(() => {
    if (typeof docFront === 'object' && 'uri' in docFront && docFront.uri) {
      setShowDocumentZoomModal(true);
    }
  }, [docFront]);

  const showActionModalFn = useCallback(() => {
    // Check if document already exists in Redux
    if (scanData && scanData.length > 0) {
      const latestScan = scanData[0];
      if (latestScan.Document_Image || latestScan.Portrait_Image) {
        // Show existing document modal
        setShowExistingDocumentModal(true);
        return;
      }
    }
    // No existing document, show action modal
    setShowActionModal(true);
  }, [scanData]);

  const handleUseExistingDocument = useCallback(() => {
    setShowExistingDocumentModal(false);
    // Navigate to Face and Finger Enrollment
    if (onSubmitSuccess) {
      onSubmitSuccess();
    } else if (navigation) {
      navigation.navigate('FaceAndFingerEnrollment');
    }
  }, [navigation, onSubmitSuccess]);

  const handleUploadNewDocument = useCallback(() => {
    setShowExistingDocumentModal(false);
    // Clear existing data and show action modal
    clearScanData();
    setIsCentreCodeEntered(false);
    setEnteredCentreCode('');
    setTimeout(() => {
      setShowActionModal(true);
    }, 300);
  }, [clearScanData]);

  const showDeleteConfirmModalFn = useCallback(() => {
    setShowDeleteConfirmModal(true);
  }, []);

  const floatY = useMemo(
    () =>
      animations.floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -15],
      }),
    [animations.floatAnim],
  );

  const infoMessage = useMemo(() => {
    if (!isCentreCodeEntered) {
      return 'Both document and portrait required to proceed';
    }
    return `Centre Code: ${enteredCentreCode} • Click delete to change documents`;
  }, [isCentreCodeEntered, enteredCentreCode]);

  return (
    <View style={styles.safeArea}>
      {/* Action Selection Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowActionModal(false)}
          />
          <View style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>Choose Action</Text>
            <Text style={styles.actionModalSubtitle}>
              Select how you want to capture the document
            </Text>

            <TouchableOpacity style={styles.actionOption} onPress={scan}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>📷</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Scan Document</Text>
                <Text style={styles.actionDescription}>
                  Use camera to scan physical document
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={recognize}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>🖼️</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Upload from Gallery</Text>
                <Text style={styles.actionDescription}>
                  Select document image from gallery
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowActionModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Centre Code Input Modal */}
      <Modal
        visible={showCentreCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCentreCodeModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowCentreCodeModal(false)}
          />
          <View style={styles.centreCodeModalContent}>
            <Text style={styles.centreCodeModalTitle}>Enter Centre Code</Text>
            <Text style={styles.centreCodeModalSubtitle}>
              Please enter your centre identification code
            </Text>

            <TextInput
              style={styles.centreCodeInput}
              placeholder="Centre Code"
              placeholderTextColor={colors.placeholderGray}
              value={centreCodeInput}
              onChangeText={setCentreCodeInput}
              autoCapitalize="characters"
              maxLength={10}
            />

            <TouchableOpacity
              style={styles.centreCodeSubmitButton}
              onPress={handleCentreCodeSubmit}>
              <Text style={styles.centreCodeSubmitButtonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.centreCodeCancelButton}
              onPress={() => setShowCentreCodeModal(false)}>
              <Text style={styles.centreCodeCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowDeleteConfirmModal(false)}
          />
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconContainer}>
              <Text style={styles.deleteIcon}>⚠️</Text>
            </View>
            <Text style={styles.deleteModalTitle}>Delete Documents?</Text>
            <Text style={styles.deleteModalSubtitle}>
              This will remove all scanned documents and you'll need to scan
              again.
            </Text>

            <TouchableOpacity
              style={styles.deleteConfirmButton}
              onPress={deleteDocuments}>
              <Text style={styles.deleteConfirmButtonText}>
                Yes, Delete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteCancelButton}
              onPress={() => setShowDeleteConfirmModal(false)}>
              <Text style={styles.deleteCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <ValidationModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        icon="⚠️"
        iconBackgroundColor={colors.dangerLight}
        title="Scan Failed"
        subtitle={errorModalMessage}
        steps={[
          {number: 1, text: 'Ensure document is fully visible in frame'},
          {number: 2, text: 'Use good lighting, avoid glare and shadows'},
          {number: 3, text: 'Keep camera steady and focused'},
        ]}
        buttonGradient={[colors.danger1, colors.danger2]}
        numberBackgroundColor={colors.danger1}
      />

      {/* Existing Document Modal */}
      <ExistingDocumentModal
        visible={showExistingDocumentModal}
        onClose={() => setShowExistingDocumentModal(false)}
        onUseExisting={handleUseExistingDocument}
        onUploadNew={handleUploadNewDocument}
        documentImage={scanData && scanData.length > 0 ? scanData[0].Document_Image : undefined}
        portraitImage={scanData && scanData.length > 0 ? scanData[0].Portrait_Image : undefined}
        scannedData={scanData && scanData.length > 0 ? scanData[0].scanned_json : undefined}
      />

      {/* Document Zoom Modal */}
      <Modal
        visible={showDocumentZoomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDocumentZoomModal(false)}>
        <View style={styles.zoomModalOverlay}>
          <TouchableOpacity
            style={styles.zoomModalBackground}
            activeOpacity={1}
            onPress={() => setShowDocumentZoomModal(false)}>
            <View style={styles.zoomModalContent}>
              <Image
                source={docFront}
                style={styles.zoomedImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {!isReadingRfidCustomUi && (
          <LinearGradient
            colors={[colors.sky1, colors.sky2, colors.sky3, colors.sky4]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.container}>
          <View style={styles.mainContainer}>
            {isScanning ? (
              <ScanLoader
                scanProgress={scanProgress}
                onCancel={stopScanProgress}
                loaderScaleAnim={animations.loaderScaleAnim}
              />
            ) : (
              <>
                <DocumentHeader fullName={fullName} />

                <DocumentCard
                  docFront={docFront}
                  onZoomPress={openDocumentZoom}
                  onDeletePress={showDeleteConfirmModalFn}
                  showDeleteButton={isCentreCodeEntered}
                  floatY={floatY}
                  welcomeScaleAnim={animations.welcomeScaleAnim}
                />

                <PortraitCard portrait={portrait} />

                {!isCentreCodeEntered && (
                  <ActionButton
                    onPress={showActionModalFn}
                    text="Scan / Upload Document"
                    icon="📷"
                    animValue={animations.buttonPressAnim}
                  />
                )}

                {isCentreCodeEntered && areImagesUploaded() && (
                  <ActionButton
                    onPress={handleSubmitButtonPress}
                    text="Submit Document Verification"
                    icon="✓"
                    colors={[colors.green1, colors.green2]}
                    animValue={animations.submitButtonAnim}
                  />
                )}

                {isCentreCodeEntered && (
                  <CentreCodeDisplay centreCode={enteredCentreCode} />
                )}

                <InfoBadge message={infoMessage} />
              </>
            )}
          </View>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayBlack50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Action Modal
  actionModalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  actionModalTitle: {
    fontSize: 24,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.bgLight,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
  },
  cancelButton: {
    backgroundColor: colors.grayLight2,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: colors.midGray,
    textAlign: 'center',
  },
  // Centre Code Modal
  centreCodeModalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  centreCodeModalTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: 8,
    textAlign: 'center',
  },
  centreCodeModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  centreCodeInput: {
    backgroundColor: colors.bgLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: colors.darkText,
    borderWidth: 1,
    borderColor: colors.borderGray,
    marginBottom: 16,
  },
  centreCodeSubmitButton: {
    backgroundColor: colors.bluePrimary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  centreCodeSubmitButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  centreCodeCancelButton: {
    backgroundColor: colors.grayLight2,
    borderRadius: 12,
    paddingVertical: 14,
  },
  centreCodeCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: colors.midGray,
    textAlign: 'center',
  },
  // Delete Modal
  deleteModalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteIcon: {
    fontSize: 36,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: colors.darkText,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: colors.midGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteConfirmButton: {
    backgroundColor: colors.danger1,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 12,
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  deleteCancelButton: {
    backgroundColor: colors.grayLight2,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: colors.midGray,
    textAlign: 'center',
  },
  // Zoom Modal
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayBlack90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalContent: {
    width: '90%',
    height: '70%',
  },
  zoomedImage: {
    width: '100%',
    height: '100%',
  },
});

const mapStateToProps = (state: RootState) => ({
  scanData: state.scan.scans,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  addScanData: (data: any) => dispatch(addScanData(data)),
  clearScanData: () => dispatch(clearScanData()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DocumentUploadScreen);
