import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  Animated as RNAnimated,
  Image,
  ScrollView,
  Easing,
  ActivityIndicator,
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
import AnimatedCameraIcon from '../components/AnimatedCameraIcon';
import CommonAlertModal from '../components/CommonAlertModal';

import {useAnimations} from '../hooks/useAnimations';

const {height, width} = Dimensions.get('window');

interface IProps {
  navigation?: NavigationProp<any>;
  addScanData: (data: any) => void;
  clearScanData: () => void;
  onSubmitSuccess?: () => void;
  scanData?: any[];
}

const HARDCODED_CENTRE_CODE = 'SLJET001';

const DocumentUploadScreen: React.FC<IProps> = ({
  navigation,
  addScanData,
  clearScanData,
  onSubmitSuccess,
  scanData,
}) => {
  const [fullName, setFullName] = useState<string>('Ready');
  const [isSDKInitializing, setIsSDKInitializing] = useState<boolean>(true);
  const [portrait, setPortrait] = useState(
    require('../assets/images/portrait.png'),
  );
  const [docFront, setDocFront] = useState(require('../assets/images/id.png'));
  const [allTextFields, setAllTextFields] = useState<any[]>([]);
  const [isCentreCodeEntered, setIsCentreCodeEntered] = useState(false);
  const [isLoadedFromExisting, setIsLoadedFromExisting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState(
    'Details Not Found',
  );
  const [showDocumentZoomModal, setShowDocumentZoomModal] = useState(false);
  const [showExistingDocumentModal, setShowExistingDocumentModal] = useState(false);
  const [showAllDetailsModal, setShowAllDetailsModal] = useState(false);
  const [canRfid, setCanRfid] = useState(false);
  const [doRfid, setDoRfid] = useState(false);
  const [isReadingRfidCustomUi, setIsReadingRfidCustomUi] = useState(false);
  const [rfidUIHeader, setRfidUIHeader] = useState('Reading RFID');
  const [rfidUIHeaderColor, setRfidUIHeaderColor] = useState('black');
  const [rfidDescription, setRfidDescription] = useState('');
  const [rfidProgress, setRfidProgress] = useState(-1);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const scanProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReadingRfid = useRef(false);

  const animations = useAnimations();
  const cardScaleAnim = useRef(new RNAnimated.Value(0.95)).current;
  const cardOpacityAnim = useRef(new RNAnimated.Value(0)).current;
  const detailsSlideAnim = useRef(new RNAnimated.Value(50)).current;
  const detailsOpacityAnim = useRef(new RNAnimated.Value(0)).current;
  const fabScaleAnim = useRef(new RNAnimated.Value(0)).current;
  const fabRotateAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    initializeDocumentReader();
    loadImagesFromRedux();
    loadExistingDocumentDetails();

    RNAnimated.parallel([
      RNAnimated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(cardOpacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    RNAnimated.timing(fabScaleAnim, {
      toValue: 1,
      duration: 800,
      delay: 400,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadImagesFromRedux();
    if (isCentreCodeEntered) {
      RNAnimated.parallel([
        RNAnimated.timing(detailsSlideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(detailsOpacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCentreCodeEntered]);

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
            () => {},
          );

          if (!scanData || scanData.length === 0 || !scanData[0].Name || scanData[0].Name === '') {
            setFullName('Ready');
          }
          setIsSDKInitializing(false);
          onInitialized();
        },
        () => {},
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

  const loadExistingDocumentDetails = useCallback(() => {
    if (scanData && scanData.length > 0) {
      const latestScan = scanData[0];

      if (latestScan.Document_Image && latestScan.Centre_Code) {
        let nameToSet = '';

        if (latestScan.Name && latestScan.Name !== 'Ready' && latestScan.Name !== '') {
          nameToSet = latestScan.Name;
        }

        if (!nameToSet && latestScan.scanned_json) {
          try {
            const fields = JSON.parse(latestScan.scanned_json);
            setAllTextFields(fields);

            const nameField = fields.find(
              (f: any) =>
                f.name?.toLowerCase().includes('surname') ||
                f.name?.toLowerCase().includes('given name') ||
                f.name?.toLowerCase() === 'name' ||
                f.name?.toLowerCase().includes('full name')
            );
            if (nameField && nameField.value) {
              nameToSet = nameField.value;
            }
          } catch (error) {
            setAllTextFields([]);
          }
        } else if (latestScan.scanned_json) {
          try {
            const fields = JSON.parse(latestScan.scanned_json);
            setAllTextFields(fields);
          } catch (error) {
            setAllTextFields([]);
          }
        }

        if (nameToSet) {
          setFullName(nameToSet);
        }

        setIsCentreCodeEntered(true);
        setIsLoadedFromExisting(true);
      }
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

    if (!scanData || scanData.length === 0) {
      showErrorModalFn('Document details not found. Please scan the document first.');
      return;
    }

    const latestScan = scanData[0];
    if (!latestScan.Document_Image || !latestScan.Portrait_Image) {
      showErrorModalFn('Document and portrait images are required to proceed with enrollment.');
      return;
    }

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

      let extractedName = '';
      if (results.textResult && results.textResult.fields) {
        const nameField = results.textResult.fields.find(
          f => f.fieldType === Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES
        );
        if (nameField && nameField.value) {
          extractedName = nameField.value.replace(/name[\s:\n]*/gi, '').trim();
        }
      }

      results.textFieldValueByType(
        Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES,
        (value: string | undefined) => {
          let cleanedName = value || '';
          if (cleanedName) {
            cleanedName = cleanedName.replace(/name[\s:\n]*/gi, '').trim();
          }
          setFullName(cleanedName || 'Document Scanned');
          ScanData.setName(cleanedName || '');
        },
        () => {},
      );

      results.graphicFieldImageByType(
        Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE,
        (value: string | undefined) => {
          if (value != null && value !== '') {
            setDocFront({uri: 'data:image/png;base64,' + value});
            ScanData.setDocument('data:image/png;base64,' + value);
          }
        },
        () => {},
      );

      results.graphicFieldImageByType(
        Enum.eGraphicFieldType.GF_PORTRAIT,
        (value: string | undefined) => {
          if (value != null && value !== '') {
            setPortrait({uri: 'data:image/png;base64,' + value});
            ScanData.setPortrait('data:image/png;base64,' + value);
          }
        },
        () => {},
      );

      let fields: any[] = [];
      if (results.textResult && results.textResult.fields) {
        results.textResult.fields.forEach(f => {
          let fieldValue = f.value;
          if (fieldValue) {
            fieldValue = fieldValue.replace(/name[\s:\n]*/gi, '').trim();
          }
          fields.push({
            name: f.fieldName,
            value: fieldValue,
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

      setTimeout(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let regCode = '';
        for (let i = 0; i < 6; i++) {
          regCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const finalData = {
          Registration_Number: regCode,
          Centre_Code: HARDCODED_CENTRE_CODE,
          Name: extractedName || ScanData.Name,
          Portrait_Image: ScanData.Portrait_Image,
          Document_Image: ScanData.Document_Image,
          scanned_json: JSON.stringify(fields || []),
        };
        clearScanData();
        addScanData(finalData);
        setIsCentreCodeEntered(true);
      }, 300);
    },
    [isResultsValid, showErrorModalFn, clearScanData, addScanData],
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
      ScanData.clear();
      clearScanData();
      setIsCentreCodeEntered(false);
      setAllTextFields([]);
      setFullName('Ready');
      setIsLoadedFromExisting(false);
      setDocFront(require('../assets/images/id.png'));
      setPortrait(require('../assets/images/portrait.png'));
    }, 300);
  }, [clearScanData]);

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
        () => {
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
            () => {
              stopScanProgress();
            },
          );
        },
      );
    }, 300);
  }, [handleButtonPress, clearResults, startScanProgress, stopScanProgress]);

  const openDocumentZoom = useCallback(() => {
    if (typeof docFront === 'object' && 'uri' in docFront && docFront.uri) {
      setShowDocumentZoomModal(true);
    }
  }, [docFront]);

  const showActionModalFn = useCallback(() => {
    if (isCentreCodeEntered && scanData && scanData.length > 0) {
      const latestScan = scanData[0];
      if (latestScan.Document_Image || latestScan.Portrait_Image) {
        setShowExistingDocumentModal(true);
        return;
      }
    }
    setShowActionModal(true);
  }, [scanData, isCentreCodeEntered]);

  const handleUseExistingDocument = useCallback(() => {
    setShowExistingDocumentModal(false);
    if (onSubmitSuccess) {
      onSubmitSuccess();
    } else if (navigation) {
      navigation.navigate('FaceAndFingerEnrollment');
    }
  }, [navigation, onSubmitSuccess]);

  const handleUploadNewDocument = useCallback(() => {
    setShowExistingDocumentModal(false);
    clearScanData();
    setIsCentreCodeEntered(false);
    setIsLoadedFromExisting(false);
    setTimeout(() => {
      setShowActionModal(true);
    }, 300);
  }, [clearScanData]);

  const showDeleteConfirmModalFn = useCallback(() => {
    setShowDeleteConfirmModal(true);
  }, []);

  const handleAlertModalClose = useCallback(() => {
    setAlertModal({
      visible: false,
      title: '',
      message: '',
    });
  }, []);

  const fabRotate = fabRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.safeArea}>
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
        onRecapture={scan}
      />

      <ExistingDocumentModal
        visible={showExistingDocumentModal}
        onClose={() => setShowExistingDocumentModal(false)}
        onUseExisting={handleUseExistingDocument}
        onUploadNew={handleUploadNewDocument}
        documentImage={scanData && scanData.length > 0 ? scanData[0].Document_Image : undefined}
        portraitImage={scanData && scanData.length > 0 ? scanData[0].Portrait_Image : undefined}
        scannedData={scanData && scanData.length > 0 ? scanData[0].scanned_json : undefined}
      />

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

      <Modal
        visible={showAllDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAllDetailsModal(false)}>
        <View style={styles.allDetailsModalOverlayCentered}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowAllDetailsModal(false)}
          />
          <View style={styles.allDetailsModalContent}>
            <View style={styles.allDetailsModalHeader}>
              <Text style={styles.allDetailsModalTitle}>📄 All Document Details</Text>
              <TouchableOpacity
                onPress={() => setShowAllDetailsModal(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.allDetailsScrollView}
              contentContainerStyle={styles.allDetailsScrollViewContent}
              showsVerticalScrollIndicator={true}>
              <View style={styles.allDetailsSection}>
                <Text style={styles.allDetailsSectionTitle}>Basic Information</Text>

                <View style={styles.allDetailsItem}>
                  <Text style={styles.allDetailsItemLabel}>👤 Full Name</Text>
                  <Text style={styles.allDetailsItemValue}>{fullName}</Text>
                </View>
              </View>

              {allTextFields.length > 0 && (
                <View style={styles.allDetailsSection}>
                  <Text style={styles.allDetailsSectionTitle}>Extracted Fields ({allTextFields.length})</Text>

                  {allTextFields.map((field, index) => (
                    <View key={index} style={styles.allDetailsItem}>
                      <Text style={styles.allDetailsItemLabel}>{field.name}</Text>
                      <Text style={styles.allDetailsItemValue}>{field.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {!isReadingRfidCustomUi && (
        <LinearGradient
          colors={['#F5F7FA', '#E8EBF0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}>
            {isScanning ? (
              <ScanLoader
                scanProgress={scanProgress}
                onCancel={stopScanProgress}
                loaderScaleAnim={animations.loaderScaleAnim}
              />
            ) : (
              <>
                <DocumentHeader fullName={fullName} />

                <RNAnimated.View
                  style={[
                    styles.documentCardWrapper,
                    {
                      transform: [{scale: cardScaleAnim}],
                      opacity: cardOpacityAnim,
                    },
                  ]}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F9FAFB']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.cardGradient}>
                    <TouchableOpacity
                      onPress={openDocumentZoom}
                      activeOpacity={0.9}>
                      <Image
                        source={docFront}
                        style={styles.documentImage}
                        resizeMode="contain"
                      />
                      {isCentreCodeEntered && (
                        <TouchableOpacity
                          style={styles.deleteButtonOverlay}
                          onPress={showDeleteConfirmModalFn}
                          activeOpacity={0.8}>
                          <LinearGradient
                            colors={['#FF6B6B', '#EE5A52']}
                            style={styles.deleteButtonGradient}>
                            <Text style={styles.deleteButtonIcon}>✕</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </RNAnimated.View>

                {isCentreCodeEntered && (
                  <RNAnimated.View
                    style={[
                      styles.scannedDetailsSection,
                      {
                        transform: [{translateY: detailsSlideAnim}],
                        opacity: detailsOpacityAnim,
                      },
                    ]}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F9FAFB']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.detailsGradient}>
                      <View style={styles.detailsHeader}>
                        <Text style={styles.detailsHeaderTitle}>📋 Document Details</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailLabelContainer}>
                          <Text style={styles.detailLabelIcon}>👤</Text>
                          <Text style={styles.detailLabel}>Full Name</Text>
                        </View>
                        <Text style={styles.detailValue}>{fullName}</Text>
                      </View>

                      {allTextFields.length > 0 && (
                        <>
                          <View style={styles.detailDivider} />
                          <View style={styles.extractedDetailsContainer}>
                            <Text style={styles.extractedDetailsTitle}>📄 Extracted Information</Text>
                            {allTextFields.slice(0, 5).map((field, index) => (
                              <View key={index} style={styles.extractedDetailItem}>
                                <Text style={styles.extractedDetailLabel}>
                                  {field.name}
                                </Text>
                                <Text style={styles.extractedDetailValue}>
                                  {field.value}
                                </Text>
                              </View>
                            ))}
                            {allTextFields.length > 5 && (
                              <TouchableOpacity
                                style={styles.moreDetailsContainer}
                                onPress={() => setShowAllDetailsModal(true)}
                                activeOpacity={0.7}>
                                <Text style={styles.moreDetailsText}>
                                  +{allTextFields.length - 5} more fields
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </RNAnimated.View>
                )}

                {isCentreCodeEntered && areImagesUploaded() && !isLoadedFromExisting && (
                  <View style={styles.submitButtonContainer}>
                    <LinearGradient
                      colors={['#00D084', '#00B86E']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.submitButtonGradient}>
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmitButtonPress}
                        activeOpacity={0.7}>
                        <Text style={styles.submitButtonText}>✓ Submit Document</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <RNAnimated.View
            style={[
              styles.floatingActionButton,
              {
                transform: [{scale: fabScaleAnim}],
              },
            ]}>
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.fabGradient}>
              <TouchableOpacity
                style={styles.fabTouchable}
                onPress={showActionModalFn}
                activeOpacity={0.7}>
                <AnimatedCameraIcon size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </RNAnimated.View>
        </LinearGradient>
      )}
      <CommonAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={handleAlertModalClose}
      />

      <Modal
        visible={isSDKInitializing}
        transparent
        animationType="fade"
        statusBarTranslucent>
        <View style={styles.sdkLoaderOverlay}>
          <View style={styles.sdkLoaderContent}>
            <View style={styles.sdkLoaderSpinner}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
            <Text style={styles.sdkLoaderTitle}>Initializing</Text>
            <Text style={styles.sdkLoaderSubtitle}>
              Please wait while we set up the document scanner...
            </Text>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  actionModalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
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
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
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
    color: '#2D3748',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: '#718096',
  },
  cancelButton: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: '#718096',
    textAlign: 'center',
  },
  centreCodeModalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
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
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  centreCodeModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  centreCodeInput: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: '#2D3748',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  centreCodeSubmitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#00D084',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centreCodeSubmitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  centreCodeSubmitButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  deleteModalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
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
    backgroundColor: '#FFE5E5',
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
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteConfirmButton: {
    backgroundColor: '#FF6B6B',
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
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Sen-SemiBold',
    color: '#718096',
    textAlign: 'center',
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
  documentCardWrapper: {
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  documentImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1.586,
    borderRadius: 8,
  },
  deleteButtonOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  deleteButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#FF6B6B',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  deleteButtonIcon: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  scannedDetailsSection: {
    marginVertical: 10,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  detailsGradient: {
    borderRadius: 14,
    padding: 14,
  },
  detailsHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  detailsHeaderTitle: {
    fontSize: 14,
    fontFamily: 'Sen-Bold',
    color: '#2D3748',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.45,
  },
  detailLabelIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Sen-SemiBold',
    color: '#4A5568',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: 'Sen-Bold',
    color: '#4F46E5',
    flex: 0.55,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  extractedDetailsContainer: {
    marginTop: 8,
  },
  extractedDetailsTitle: {
    fontSize: 12,
    fontFamily: 'Sen-Bold',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 2,
  },
  extractedDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#4F46E5',
  },
  extractedDetailLabel: {
    fontSize: 11,
    fontFamily: 'Sen-SemiBold',
    color: '#4A5568',
    flex: 0.45,
  },
  extractedDetailValue: {
    fontSize: 11,
    fontFamily: 'Sen-Regular',
    color: '#2D3748',
    flex: 0.55,
    textAlign: 'right',
  },
  moreDetailsContainer: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(79, 70, 229, 0.04)',
    borderRadius: 8,
    marginTop: 2,
  },
  moreDetailsText: {
    fontSize: 15,
    fontFamily: 'Sen-SemiBold',
    color: '#4F46E5',
    textAlign: 'center',
  },
  submitButtonContainer: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#00D084',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonGradient: {
    borderRadius: 12,
  },
  submitButton: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: 'Sen-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#4F46E5',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingActionButtonIcon: {
    fontSize: 24,
  },
  allDetailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  allDetailsModalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allDetailsModalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    maxHeight: '80%',
    width: '90%',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  allDetailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  allDetailsModalTitle: {
    fontSize: 18,
    fontFamily: 'Sen-Bold',
    color: '#2D3748',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#718096',
    fontWeight: 'bold',
  },
  allDetailsScrollView: {
    flexGrow: 0,
    maxHeight: 400,
  },
  allDetailsScrollViewContent: {
    paddingBottom: 20,
  },
  allDetailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  allDetailsSectionTitle: {
    fontSize: 14,
    fontFamily: 'Sen-Bold',
    color: '#4F46E5',
    marginBottom: 12,
  },
  allDetailsItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  allDetailsItemLabel: {
    fontSize: 12,
    fontFamily: 'Sen-SemiBold',
    color: '#4A5568',
    marginBottom: 4,
  },
  allDetailsItemValue: {
    fontSize: 13,
    fontFamily: 'Sen-Regular',
    color: '#2D3748',
  },
  sdkLoaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sdkLoaderContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sdkLoaderSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sdkLoaderTitle: {
    fontSize: 22,
    fontFamily: 'Sen-Bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  sdkLoaderSubtitle: {
    fontSize: 14,
    fontFamily: 'Sen-Regular',
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
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