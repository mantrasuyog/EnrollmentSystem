package ai.tech5.finger.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

import ai.tech5.sdk.abis.T5AirSnap.RawImage;
import ai.tech5.sdk.abis.T5AirSnap.SgmRectImage;
import ai.tech5.sdk.abis.T5AirSnap.T5AirSnap;

public class AirsnapUtils {

    private final T5AirSnap m_cellSdk;
    private final ExecutorService m_service;

    public AirsnapUtils(T5AirSnap cellSdk, ExecutorService service) {
        this.m_cellSdk = cellSdk;
        this.m_service = service;
    }

    public HashMap<Integer, Quality> createTemplates(List<SgmRectImage> rects) {
        int threadCount = rects.size();
        short defaultPpi = 500;

        CreateTemplateThread[] createTemplateThreads = null;
        HashMap<Integer, Quality> nistQualitiesMap = new HashMap<>();

        try {
            createTemplateThreads = new CreateTemplateThread[threadCount];
            ArrayList<Future<Runnable>> futures = new ArrayList<>();
            int threadIndex;
            for (threadIndex = 0; threadIndex < threadCount; threadIndex++) {
                SgmRectImage rect = rects.get(threadIndex);

                RawImage fingerRawImage = new RawImage();
                fingerRawImage.m_finger = rect.pos;
                fingerRawImage.m_image = rect.image;
                fingerRawImage.m_width = rect.width;
                fingerRawImage.m_height = rect.height;
                fingerRawImage.m_ppi = defaultPpi;

                createTemplateThreads[threadIndex] = new CreateTemplateThread(m_cellSdk, fingerRawImage);

                Future future = m_service.submit(createTemplateThreads[threadIndex]);
                futures.add(future);
            }

            for (Future<Runnable> future : futures) {
                future.get();
            }

            for (threadIndex = 0; threadIndex < threadCount; threadIndex++) {
                CreateTemplateThread thread = createTemplateThreads[threadIndex];

                Quality quality = new Quality();
                quality.nistQuality = thread.getNistQuality();
                quality.quality = thread.getQuality();
                quality.minutiaesNumber = thread.getMinutiaesNumber();
                quality.template = thread.getTemplate();

                int finger = thread.getFingerPos();
                nistQualitiesMap.put(finger, quality);
            }

        } catch (Exception exception) {
            exception.printStackTrace();
        }

        return nistQualitiesMap;
    }

    public HashMap<Integer, Byte> getNist2QualityValues(List<SgmRectImage> rects) {
        int threadCount = rects.size();
        HashMap<Integer, Byte> nist2QualitiesMap = new HashMap<>();

        GetNistQualityThread[] getNistQualityThreads = null;

        try {
            getNistQualityThreads = new GetNistQualityThread[threadCount];
            ArrayList<Future<Runnable>> futures = new ArrayList<>();

            for (int threadIndex = 0; threadIndex < threadCount; threadIndex++) {
                SgmRectImage rect = rects.get(threadIndex);
                getNistQualityThreads[threadIndex] = new GetNistQualityThread(m_cellSdk, rect);

                Future future = m_service.submit(getNistQualityThreads[threadIndex]);
                futures.add(future);
            }

            for (Future<Runnable> future : futures) {
                future.get();
            }

            for (int threadIndex = 0; threadIndex < threadCount; threadIndex++) {
                byte nist2Quality = getNistQualityThreads[threadIndex].getNistQuality();
                int finger = getNistQualityThreads[threadIndex].getFingerPos();
                nist2QualitiesMap.put(finger, nist2Quality);
            }

        } catch (Exception ex) {
            ex.printStackTrace();
        }

        return nist2QualitiesMap;
    }


    public byte[] convertImage(byte[] rawImage, int width, int height, ImageType type, boolean resize, int newWidth, int newHeight, float compressionRatio, int paddingColor) {
        byte[] convertedImage = null;
        byte[] resizedImage = rawImage;
        int newW = width;
        int newH = height;


        try {
            if (resize) {
                newW = newWidth;
                newH = newHeight;


                byte[] newImage = new byte[newW * newH];

                int retVal = m_cellSdk.cropImage(rawImage, width, height, newImage, newW, newH, paddingColor);


                if (retVal == 0) {

                    resizedImage = newImage;
                }
            }

            if (resizedImage != null) {
                if (type == ImageType.IMAGE_TYPE_BMP) {

                    convertedImage = m_cellSdk.convertRawToBmp(resizedImage, newW, newH);

                } else if (type == ImageType.IMAGE_TYPE_PNG) {

                    convertedImage = m_cellSdk.convertRawToPng(resizedImage, newW, newH);

                } else {

                    convertedImage = m_cellSdk.convertRawToWsq(resizedImage, newW, newH, compressionRatio);

                }

            }
        } catch (Exception e) {
            return new byte[0];
        }

        return convertedImage;
    }
}