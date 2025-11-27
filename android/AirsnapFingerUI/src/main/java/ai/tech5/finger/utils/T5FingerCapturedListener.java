package ai.tech5.finger.utils;

public interface T5FingerCapturedListener {
  void onSuccess(FingerCaptureResult paramFingerCaptureResult);
  
  void onFailure(String paramString);
  
  void onCancelled();
  
  void onTimedout();
  
  //void onReset();
}


