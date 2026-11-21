<?
include("../../connect.php"); 

if(isset($_POST['value'])){

	date_default_timezone_set('Asia/Calcutta');
	$cdate = date('Y-m-d');
	$value = $_POST['value'];
	
	$time = time();

	$amount = (float)$value;
	$receipt = 'rcptid_'.$time.'_2312';
	$postData = array(
		'amount' => (int)$amount, //in Paise
		'currency' => 'INR',  //Indian Rupees
		'receipt' => $receipt,  //unique everytime
		'payment_capture' => '1' //auto capture
	);
	
	$url="https://rzp_test_rtFXsHRpKlthlK:Q7ule7vfld8KC4TRfxYZm33v@api.razorpay.com/v1/orders"; //bth

	$ch = curl_init();
    		
    curl_setopt_array($ch, array(
    	CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData
        //,CURLOPT_FOLLOWLOCATION => true
    ));
     
    //Ignore SSL certificate verification
    	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
	    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    
    //get response
  echo   $output = curl_exec($ch);
     $ee =  json_decode($output);
	
	$idd = $ee->id;
    //echo $output;   	
	$value = doubleval($value)/doubleval('100');
	$value = strval($value);

	$query = mysqli_query($con,"INSERT INTO `tbl_webhook_razorpay_txn`(`order_id`, `status`, `txn_id`, `amount`, `txn_date`, `created_at`) VALUES ('$idd','Pending','','$value','$cdate','$cdatetime')");

}
?>