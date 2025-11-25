import React, { useState, useRef, useEffect } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  NativeEventEmitter,
  Platform,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native'
import DocumentReader, {
  Enum,
  DocumentReaderCompletion,
  DocumentReaderScenario,
  RNRegulaDocumentReader,
  DocumentReaderResults,
  DocumentReaderNotification,
  ScannerConfig,
  RecognizeConfig,
  DocReaderConfig,
  Functionality
} from '@regulaforensics/react-native-document-reader-api'
import * as RNFS from 'react-native-fs'
import CustomRadioGroup, { RadioButtonProps } from '../components/CustomRadioGroup'
import { CheckBox } from '@rneui/themed'
import Icon from 'react-native-vector-icons/FontAwesome'
import { launchImageLibrary } from 'react-native-image-picker'
import * as Progress from 'react-native-progress'

const { width, height } = Dimensions.get('window')

var isReadingRfid: boolean = false

interface IResultItem {
  key: string
  label: string
  value: string | undefined
  icon: string
}

interface IDocumentReaderState {
  fullName: string | undefined
  doRfid: boolean
  isReadingRfidCustomUi: boolean
  rfidUIHeader: string
  rfidUIHeaderColor: string
  rfidDescription: string
  rfidProgress: number
  canRfid: boolean
  canRfidTitle: string
  radioButtons: RadioButtonProps[]
  selectedScenario: string
  portrait: any
  docFront: any
  showResults: boolean
  showDetailsModal: boolean
  allResults: IResultItem[]
  isInitializing: boolean
}

const ANIMATION_DURATION = {
  MODAL_ENTER: 400,
  MODAL_EXIT: 300,
  INITIAL_LOAD: 600,
  CARD_STAGGER: 100
}

const COLORS = {
  PRIMARY: '#667eea',
  PRIMARY_DARK: '#764ba2',
  ACCENT: '#f5576c',
  SECONDARY: '#f093fb',
  CYAN: '#4facfe',
  CYAN_LIGHT: '#00f2fe',
  YELLOW: '#fa709a',
  YELLOW_LIGHT: '#fee140',
  TEAL: '#a8edea',
  TEAL_LIGHT: '#fed6e3',
  WHITE: '#ffffff',
  LIGHT_GRAY: '#f5f5f5',
  DARK: '#333333',
  TEXT_MUTED: '#999999',
  BORDER: '#e0e0e0',
  ERROR: '#ff6b6b'
}

const App: React.FC = () => {
  
  const [state, setState] = useState<IDocumentReaderState>({
    fullName: 'Please wait...',
    doRfid: false,
    isReadingRfidCustomUi: false,
    rfidUIHeader: '',
    rfidUIHeaderColor: 'black',
    rfidDescription: '',
    rfidProgress: -1,
    canRfid: false,
    canRfidTitle: '(unavailable)',
    radioButtons: [{ label: 'Loading', id: '0' }],
    selectedScenario: '',
    portrait: require('../assets/images/portrait.png'),
    docFront: require('../assets/images/id.png'),
    showResults: false,
    showDetailsModal: false,
    allResults: [],
    isInitializing: true
  })

  const animationValue = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(0.9)).current
  const modalAnimationValue = useRef(new Animated.Value(0)).current
  const cardAnimations = useRef<{ [key: string]: Animated.Value }>({}).current

  useEffect(() => {
    Icon.loadFont()
    initializeDocumentReader()
    setupEventListeners()

    return () => {
      
    }
  }, [])

  const setupEventListeners = (): void => {
    const eventManager = new NativeEventEmitter(RNRegulaDocumentReader)
    eventManager.addListener('completion', (e) => {
      const completion = DocumentReaderCompletion.fromJson(
        JSON.parse(e['msg'])
      )
      if (completion) {
        handleCompletion(completion)
      }
    })

    eventManager.addListener('rfidOnProgressCompletion', (e) => {
      const notification = DocumentReaderNotification.fromJson(
        JSON.parse(e['msg'])
      )
      if (notification) {
        updateRfidUI(notification)
      }
    })
  }

  const initializeDocumentReader = async (): Promise<void> => {
    try {
      const licPath =
        Platform.OS === 'ios'
          ? RNFS.MainBundlePath + '/regula.license'
          : 'regula.license'

      const readFile =
        Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets

      const licenseData = await readFile(licPath, 'base64')

      setState((prev) => ({ ...prev, fullName: 'Initializing...' }))

      const config = new DocReaderConfig()
      config.license = licenseData
      config.delayedNNLoad = true

      DocumentReader.initializeReader(
        config,
        (response) => {
          const result = JSON.parse(response)
          if (!result['success']) {
            return
          }

          DocumentReader.getIsRFIDAvailableForUse(
            (canRfid: boolean) => {
              if (canRfid) {
                setState((prev) => ({
                  ...prev,
                  canRfid: true,
                  rfidUIHeader: 'Reading RFID',
                  rfidDescription: 'Place your phone on top of the NFC tag',
                  rfidUIHeaderColor: 'black',
                  canRfidTitle: ''
                }))
              }
            },
            () => {}
          )

          DocumentReader.getAvailableScenarios(
            (jstring: string) => {
              const scenarios = JSON.parse(jstring)
              const items: RadioButtonProps[] = []

              for (const key in scenarios) {
                const scenario = DocumentReaderScenario.fromJson(
                  typeof scenarios[key] === 'string'
                    ? JSON.parse(scenarios[key])
                    : scenarios[key]
                )
                if (scenario && scenario.name) {
                  items.push({ label: scenario.name, id: scenario.name })
                }
              }

              setState((prev) => ({
                ...prev,
                radioButtons: items,
                selectedScenario: items.length > 0 ? items[0].id : '',
                isInitializing: false
              }))

              onInitialized()
            },
            () => {}
          )
        },
        () => {}
      )
    } catch {
      setState((prev) => ({ ...prev, isInitializing: false }))
    }
  }

  const onInitialized = (): void => {
    setState((prev) => ({ ...prev, fullName: 'Ready' }))

    const functionality = new Functionality()
    functionality.showCaptureButton = true
    DocumentReader.setFunctionality(functionality, () => {}, () => {})
  }

  const startAnimation = (): void => {
    Animated.parallel([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: ANIMATION_DURATION.INITIAL_LOAD,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true
      })
    ]).start()
  }

  const openDetailsModal = (): void => {
    setState((prev) => ({ ...prev, showDetailsModal: true }))
    Animated.timing(modalAnimationValue, {
      toValue: 1,
      duration: ANIMATION_DURATION.MODAL_ENTER,
      useNativeDriver: true
    }).start()
  }

  const closeDetailsModal = (): void => {
    Animated.timing(modalAnimationValue, {
      toValue: 0,
      duration: ANIMATION_DURATION.MODAL_EXIT,
      useNativeDriver: true
    }).start(() => {
      setState((prev) => ({ ...prev, showDetailsModal: false }))
    })
  }

  const animateCard = (index: number): void => {
    const animValue = new Animated.Value(0)
    cardAnimations[index] = animValue

    Animated.timing(animValue, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start()
  }

  const actionSuccess = (action: number): boolean => {
    return (
      action === Enum.DocReaderAction.COMPLETE ||
      action === Enum.DocReaderAction.TIMEOUT
    )
  }

  const actionError = (action: number): boolean => {
    return (
      action === Enum.DocReaderAction.CANCEL ||
      action === Enum.DocReaderAction.ERROR
    )
  }

  const handleCompletion = (completion: DocumentReaderCompletion): void => {
    if (state.isReadingRfidCustomUi) {
      if (completion.action === Enum.DocReaderAction.ERROR) {
        restartRfidUI()
      }
      if (
        actionSuccess(completion.action || 0) ||
        actionError(completion.action || 0)
      ) {
        hideRfidUI()
        if (completion.results) {
          displayResults(completion.results)
        }
      }
    } else if (
      actionSuccess(completion.action || 0) ||
      actionError(completion.action || 0)
    ) {
      if (completion.results) {
        handleResults(completion.results)
      }
    }
  }

  const updateRfidUI = (notification: DocumentReaderNotification): void => {
    if (
      notification.notificationCode ===
      Enum.eRFID_NotificationCodes.RFID_NOTIFICATION_PCSC_READING_DATAGROUP
    ) {
      setState((prev) => ({
        ...prev,
        rfidDescription: 'ERFIDDataFileType: ' + notification.dataFileType
      }))
    }

    setState((prev) => ({
      ...prev,
      rfidUIHeader: 'Reading RFID',
      rfidUIHeaderColor: 'black'
    }))

    if (notification.progress !== null) {
      setState((prev) => ({
        ...prev,
        rfidProgress: notification.progress / 100
      }))
    }

    if (Platform.OS === 'ios') {
      DocumentReader.setRfidSessionStatus(
        state.rfidDescription + '\n' + notification.progress + '%',
        () => {},
        () => {}
      )
    }
  }

  const showRfidUI = (): void => {
    setState((prev) => ({ ...prev, isReadingRfidCustomUi: true }))
  }

  const hideRfidUI = (): void => {
    DocumentReader.stopRFIDReader(() => {}, () => {})
    restartRfidUI()
    setState((prev) => ({
      ...prev,
      isReadingRfidCustomUi: false,
      rfidUIHeader: 'Reading RFID',
      rfidUIHeaderColor: 'black'
    }))
  }

  const restartRfidUI = (): void => {
    setState((prev) => ({
      ...prev,
      rfidUIHeaderColor: 'red',
      rfidUIHeader: 'Failed!',
      rfidDescription: 'Place your phone on top of the NFC tag',
      rfidProgress: -1
    }))
  }

  const displayResults = (results: DocumentReaderResults): void => {
    if (!results) return

    const resultsArray: IResultItem[] = []

    results.textFieldValueByType(
      Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES,
      (value: string | undefined) => {
        if (value) {
          setState((prev) => ({ ...prev, fullName: value }))
          resultsArray.push({
            key: 'fullName',
            label: 'Full Name',
            value,
            icon: 'user'
          })
        }
      },
      () => {}
    )

    results.graphicFieldImageByType(
      Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE,
      (value: string | undefined) => {
        if (value && value !== '') {
          setState((prev) => ({
            ...prev,
            docFront: { uri: 'data:image/png;base64,' + value }
          }))
        }
      },
      () => {}
    )

    results.graphicFieldImageByType(
      Enum.eGraphicFieldType.GF_PORTRAIT,
      (value: string | undefined) => {
        if (value && value !== '') {
          setState((prev) => ({
            ...prev,
            portrait: { uri: 'data:image/png;base64,' + value }
          }))
        }
      },
      () => {}
    )

    results.graphicFieldImageByTypeSource(
      Enum.eGraphicFieldType.GF_PORTRAIT,
      Enum.eRPRM_ResultType.RFID_RESULT_TYPE_RFID_IMAGE_DATA,
      (value: string | undefined) => {
        if (value && value !== '') {
          setState((prev) => ({
            ...prev,
            portrait: { uri: 'data:image/png;base64,' + value }
          }))
        }
      },
      () => {}
    )

    const textFieldTypes: Array<{
      type: number
      label: string
      icon: string
    }> = [
      { type: Enum.eVisualFieldType.FT_SURNAME, label: 'Surname', icon: 'font' },
      {
        type: Enum.eVisualFieldType.FT_GIVEN_NAMES,
        label: 'Given Names',
        icon: 'font'
      },
      {
        type: Enum.eVisualFieldType.FT_DATE_OF_BIRTH,
        label: 'Date of Birth',
        icon: 'calendar'
      },
      {
        type: Enum.eVisualFieldType.FT_DOCUMENT_NUMBER,
        label: 'Document Number',
        icon: 'hashtag'
      },
      {
        type: Enum.eVisualFieldType.FT_NATIONALITY,
        label: 'Nationality',
        icon: 'globe'
      },
      {
        type: Enum.eVisualFieldType.FT_SEX,
        label: 'Sex',
        icon: 'venus-mars'
      },
      {
        type: Enum.eVisualFieldType.FT_PLACE_OF_BIRTH,
        label: 'Place of Birth',
        icon: 'location-arrow'
      },
      {
        type: Enum.eVisualFieldType.FT_ADDRESS,
        label: 'Address',
        icon: 'home'
      }
    ]

    textFieldTypes.forEach((field) => {
      results.textFieldValueByType(
        field.type,
        (value: string | undefined) => {
          if (value) {
            resultsArray.push({
              key: field.label.toLowerCase(),
              label: field.label,
              value,
              icon: field.icon
            })
          }
        },
        () => {}
      )
    })

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        allResults: resultsArray,
        showResults: true
      }))
      startAnimation()
      resultsArray.forEach((_, index) => {
        setTimeout(() => animateCard(index), index * ANIMATION_DURATION.CARD_STAGGER)
      })
    }, 500)
  }

  const clearResults = (): void => {
    setState((prev) => ({
      ...prev,
      fullName: 'Ready',
      docFront: require('../assets/images/id.png'),
      portrait: require('../assets/images/portrait.png'),
      showResults: false,
      allResults: [],
      showDetailsModal: false
    }))

    animationValue.setValue(0)
    scaleAnimation.setValue(0.9)
    modalAnimationValue.setValue(0)
    cardAnimations.length = 0
  }

  const scan = (): void => {
    clearResults()
    const config = new ScannerConfig()
    config.scenario = state.selectedScenario
    DocumentReader.startScanner(config, () => {}, () => {})
  }

  const recognize = (): void => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        selectionLimit: 10
      },
      (r) => {
        if (r.errorCode) {
          setState((prev) => ({ ...prev, fullName: r.errorMessage }))
          return
        }

        if (r.didCancel) return

        clearResults()
        setState((prev) => ({ ...prev, fullName: 'COPYING IMAGE...' }))

        const images: string[] = []
        if (r.assets) {
          r.assets.forEach((asset) => {
            if (asset.base64) {
              images.push(asset.base64)
            }
          })
        }

        setState((prev) => ({ ...prev, fullName: 'PROCESSING...' }))

        const config = new RecognizeConfig()
        config.scenario = state.selectedScenario
        config.images = images
        DocumentReader.recognize(config, () => {}, () => {})
      }
    )
  }

  const usualRFID = (): void => {
    isReadingRfid = true
    DocumentReader.startRFIDReader(false, false, false, () => {}, () => {})
  }

  const handleResults = (results: DocumentReaderResults): void => {
    if (
      state.doRfid &&
      !isReadingRfid &&
      results &&
      results.chipPage !== 0
    ) {
      usualRFID()
    } else {
      isReadingRfid = false
      displayResults(results)
    }
  }

  const renderDetailCard = (item: IResultItem, index: number): JSX.Element => {
    const animValue = cardAnimations[index] || new Animated.Value(0)
    const translateX = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [width, 0]
    })
    const opacity = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    })

    return (
      <Animated.View
        key={item.key}
        style={{
          opacity,
          transform: [{ translateX }],
          marginBottom: 12
        }}
      >
        <View style={styles.detailCard}>
          <View style={styles.detailIconContainer}>
            <Icon name={item.icon} size={24} color={COLORS.WHITE} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>{item.label}</Text>
            <Text style={styles.detailValue}>{item.value}</Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  const fadeInAnimation = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  })

  const modalScale = modalAnimationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  })

  if (state.isInitializing) {
    return (
      <View
        style={[
          styles.mainContainer,
          { backgroundColor: COLORS.SECONDARY }
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.loadingText}>{state.fullName}</Text>
        </View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: COLORS.SECONDARY }
      ]}
    >
      {!state.isReadingRfidCustomUi && !state.showResults && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeInAnimation,
              transform: [{ scale: scaleAnimation }]
            }
          ]}
        >
          {}
          <View
            style={[
              styles.headerCard,
              { backgroundColor: COLORS.PRIMARY }
            ]}
          >
            <Icon name="id-card" size={30} color={COLORS.WHITE} />
            <Text style={styles.title}>{state.fullName}</Text>
          </View>

          {}
          <View style={styles.imagesContainer}>
            <View
              style={[
                styles.imageCard,
                { backgroundColor: COLORS.SECONDARY }
              ]}
            >
              <Text style={styles.imageLabel}>Portrait</Text>
              <View style={styles.imageBorder}>
                <Image
                  style={styles.portrait}
                  source={state.portrait}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View
              style={[
                styles.imageCard,
                { backgroundColor: COLORS.CYAN }
              ]}
            >
              <Text style={styles.imageLabel}>Document</Text>
              <View style={styles.imageBorder}>
                <Image
                  style={styles.document}
                  source={state.docFront}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {}
          <ScrollView
            style={styles.scenarioScroll}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.scenarioCard,
                { backgroundColor: COLORS.YELLOW }
              ]}
            >
              <Text style={styles.scenarioTitle}>Select Document Type</Text>
              <RadioGroup
                containerStyle={styles.radioContainer}
                radioButtons={state.radioButtons}
                onPress={(selectedID: string) => {
                  setState((prev) => ({ ...prev, selectedScenario: selectedID }))
                }}
                selectedId={state.selectedScenario}
                layout="column"
              />
            </View>
          </ScrollView>

          {}
          <View
            style={[
              styles.checkboxCard,
              { backgroundColor: COLORS.TEAL }
            ]}
          >
            <CheckBox
              containerStyle={{ backgroundColor: 'transparent' }}
              checked={state.doRfid}
              title={'Process RFID Reading' + state.canRfidTitle}
              titleProps={{ style: styles.checkboxTitle }}
              onPress={() => {
                if (state.canRfid) {
                  setState((prev) => ({ ...prev, doRfid: !prev.doRfid }))
                }
              }}
            />
          </View>

          {}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: COLORS.PRIMARY }
              ]}
              onPress={scan}
            >
              <Icon name="camera" size={20} color={COLORS.WHITE} />
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: COLORS.ACCENT }
              ]}
              onPress={recognize}
            >
              <Icon name="image" size={20} color={COLORS.WHITE} />
              <Text style={styles.buttonText}>Image</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {}
      {state.isReadingRfidCustomUi && (
        <View style={styles.rfidContainer}>
          <View
            style={[
              styles.rfidCard,
              { backgroundColor: COLORS.PRIMARY }
            ]}
          >
            <Icon
              name="wifi"
              size={50}
              color={
                state.rfidUIHeaderColor === 'red'
                  ? COLORS.ERROR
                  : COLORS.WHITE
              }
            />
            <Text
              style={[
                styles.rfidHeader,
                {
                  color:
                    state.rfidUIHeaderColor === 'red'
                      ? COLORS.ERROR
                      : COLORS.WHITE
                }
              ]}
            >
              {state.rfidUIHeader}
            </Text>
            <Text style={styles.rfidDescription}>
              {state.rfidDescription}
            </Text>
            <Progress.Bar
              style={styles.progressBar}
              width={200}
              color="#4285F4"
              progress={state.rfidProgress}
            />
            <TouchableOpacity
              style={styles.rfidCancelButton}
              onPress={hideRfidUI}
            >
              <Icon name="times-circle" size={50} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {}
      {state.showResults && (
        <Animated.View
          style={[styles.resultsContainer, { opacity: fadeInAnimation }]}
        >
          <View
            style={[
              styles.resultsHeader,
              { backgroundColor: COLORS.PRIMARY }
            ]}
          >
            <Icon name="check-circle" size={30} color={COLORS.WHITE} />
            <Text style={styles.resultsTitle}>Scan Complete!</Text>
          </View>

          <View style={styles.resultsImagesContainer}>
            <View
              style={[
                styles.resultImageCard,
                { backgroundColor: COLORS.SECONDARY }
              ]}
            >
              <Text style={styles.resultImageLabel}>Portrait</Text>
              <Image
                style={styles.resultPortrait}
                source={state.portrait}
                resizeMode="contain"
              />
            </View>

            <View
              style={[
                styles.resultImageCard,
                { backgroundColor: COLORS.CYAN }
              ]}
            >
              <Text style={styles.resultImageLabel}>Document</Text>
              <Image
                style={styles.resultDocument}
                source={state.docFront}
                resizeMode="contain"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.viewDetailsButton,
              { backgroundColor: COLORS.PRIMARY }
            ]}
            onPress={openDetailsModal}
          >
            <Icon name="list-alt" size={20} color={COLORS.WHITE} />
            <Text style={styles.viewDetailsText}>View Full Details</Text>
            <Icon name="chevron-right" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>

          <View style={styles.resultButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.resultButton,
                { backgroundColor: COLORS.PRIMARY }
              ]}
              onPress={clearResults}
            >
              <Icon name="arrow-left" size={20} color={COLORS.WHITE} />
              <Text style={styles.resultButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resultButton,
                { backgroundColor: COLORS.ACCENT }
              ]}
              onPress={scan}
            >
              <Icon name="repeat" size={20} color={COLORS.WHITE} />
              <Text style={styles.resultButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {}
      <Modal
        visible={state.showDetailsModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeDetailsModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: modalAnimationValue
            }
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeDetailsModal}
          />

          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: modalAnimationValue,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            {}
            <View
              style={[
                styles.modalHeader,
                { backgroundColor: COLORS.PRIMARY }
              ]}
            >
              <Text style={styles.modalTitle}>Document Information</Text>
              <TouchableOpacity onPress={closeDetailsModal}>
                <Icon name="times" size={28} color={COLORS.WHITE} />
              </TouchableOpacity>
            </View>

            {}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalBodyContent}
            >
              {state.allResults.map((item, index) =>
                renderDetailCard(item, index)
              )}
            </ScrollView>

            {}
            <View
              style={[
                styles.modalFooter,
                { backgroundColor: COLORS.PRIMARY }
              ]}
            >
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeDetailsModal}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE
  },
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  headerCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginLeft: 12,
    flex: 1
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
    gap: 12
  },
  imageCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 8
  },
  imageBorder: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8
  },
  portrait: {
    height: 120,
    width: 100,
    borderRadius: 4
  },
  document: {
    height: 100,
    width: 130,
    borderRadius: 4
  },
  scenarioScroll: {
    width: '100%',
    marginBottom: 16,
    maxHeight: 180
  },
  scenarioCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 8
  },
  radioContainer: {
    alignItems: 'flex-start'
  },
  checkboxCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  },
  checkboxTitle: {
    color: COLORS.DARK,
    fontWeight: '500',
    marginLeft: 8
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center'
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  rfidContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  rfidCard: {
    width: '85%',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10
  },
  rfidHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 24,
    fontWeight: '700'
  },
  rfidDescription: {
    paddingBottom: 24,
    fontSize: 16,
    color: COLORS.WHITE,
    textAlign: 'center'
  },
  progressBar: {
    marginBottom: 30,
    borderRadius: 10
  },
  rfidCancelButton: {
    marginTop: 20,
    padding: 8
  },
  resultsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  resultsHeader: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginLeft: 12
  },
  resultsImagesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    height: 140
  },
  resultImageCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  },
  resultImageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 6
  },
  resultPortrait: {
    height: 90,
    width: 75,
    borderRadius: 6
  },
  resultDocument: {
    height: 80,
    width: 110,
    borderRadius: 6
  },
  viewDetailsButton: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  viewDetailsText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  resultButtonsContainer: {
    flexDirection: 'row',
    gap: 12
  },
  resultButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  resultButtonText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalContent: {
    width: width * 0.92,
    maxHeight: height * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.WHITE,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16
  },
  modalHeader: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
    flex: 1
  },
  modalBody: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY
  },
  modalBodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 0
  },
  detailCard: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  detailContent: {
    flex: 1
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.WHITE
  },
  modalFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  modalCloseButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase'
  }
})

export default App