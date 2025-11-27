 package ai.tech5.finger.utils;

 import android.content.Context;
 import android.content.Intent;
 import android.content.pm.PackageManager;
 import android.content.pm.ResolveInfo;
 import java.io.PrintWriter;
 import java.io.StringWriter;
 import java.util.List;


 public class MyExceptionHandler
   implements Thread.UncaughtExceptionHandler
 {
   private final Context myContext;

   public MyExceptionHandler(Context context) {
     this.myContext = context;
   }


   public void uncaughtException(Thread thread, Throwable exception) {
     StringWriter stackTrace = new StringWriter();
     exception.printStackTrace(new PrintWriter(stackTrace));


     sendUserCrashedLogs(stackTrace);
     System.exit(0);
   }


   private void sendUserCrashedLogs(StringWriter stackTrace) {
     Intent emailIntent = new Intent("android.intent.action.SEND");


     String[] emailAdrs = { "" };

     emailIntent.putExtra("android.intent.extra.EMAIL", emailAdrs);
     emailIntent.putExtra("android.intent.extra.SUBJECT", "Crash Logs");
     emailIntent.setType("text/plain");
     emailIntent.putExtra("android.intent.extra.TEXT", stackTrace.toString());
     PackageManager pm = this.myContext.getPackageManager();
     List<ResolveInfo> matches = pm.queryIntentActivities(emailIntent, 0);
     ResolveInfo best = null;
     for (ResolveInfo info : matches) {
       if (info.activityInfo.packageName.endsWith(".gm") || info.activityInfo.name.toLowerCase().contains("gmail"))
         best = info;
     }  if (best != null)
       emailIntent.setClassName(best.activityInfo.packageName, best.activityInfo.name);
     this.myContext.startActivity(emailIntent);
   }
 }


