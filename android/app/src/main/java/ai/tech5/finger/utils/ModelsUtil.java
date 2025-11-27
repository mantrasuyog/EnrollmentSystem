package ai.tech5.finger.utils;

import android.content.Context;
import android.content.res.AssetManager;
import android.os.Build;
import android.util.Log;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

public class ModelsUtil {


    public static  void extractModels(Context context, String assetsDir, String extractDir) {
        String targetDir = extractDir + File.separator + assetsDir;
        File theDir = new File(targetDir);

        if (!theDir.exists()) {
            theDir.mkdirs();
        }
        try {
            AssetManager assetsManager = context.getAssets();

            String[] filenames = assetsManager.list(assetsDir);

            if(filenames==null){
                return;
            }

            for (String file : filenames) {

                File targetFile = new File(targetDir + File.separator + file);


                if (isFile(assetsManager, file, assetsDir)) {
                    Log.d("TAG", "copying file " + file);
                    InputStream inputStream = assetsManager.open(assetsDir + File.separator + file);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        Files.copy(inputStream, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    } else {
                        OutputStream out = new BufferedOutputStream(new FileOutputStream(targetFile, false));
                        byte[] buffer = new byte[1024];
                        int lengthRead;
                        while ((lengthRead = inputStream.read(buffer)) > 0) {
                            out.write(buffer, 0, lengthRead);
                            out.flush();
                        }
                    }
                    inputStream.close();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

    }


    public static  boolean isFile(AssetManager assetManager, String fileName, String parent) {
        try {


            String[] subFiles = assetManager.list(parent + File.separator + fileName);
            if (subFiles != null && subFiles.length > 0) {
                // It's a directory, so skip it

                return false;
            } else {

                // It's a file, so copy it
                return true;
            }
        } catch (IOException e) {
            Log.e("TAG", "Error checking file or folder: " + fileName, e);
            return false;
        }
    }
}
