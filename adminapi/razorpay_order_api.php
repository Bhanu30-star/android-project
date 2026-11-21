<?
include("../../connect.php"); 
$response = array();
if(isset($_POST['amount']) && isset($_POST['distributor_id']))
{
	$amount = $_POST['amount'];
	$distributor_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$distributor_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$time = time();
	$receipt = 'rcptid_'.$time.'_'.$distributor_id;
	$postData = array(
		'amount' => (int)$amount, //in Paise
		'currency' => 'INR',  //Indian Rupees
		'receipt' => $receipt,  //unique everytime
		'payment_capture' => '1' //auto capture
	);
	// $url="https://rzp_live_76zXlorDA7pu6N:tZDluXuw5z8fu5GG8lutjQNa@api.razorpay.com/v1/orders";
	$url="https://rzp_live_kA93dbQFCMNf0j:Fg0e61mR4TOSiYiW8KE9Gezm@api.razorpay.com/v1/orders";
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
    echo	$output = curl_exec($ch);
    //echo $output;   	
    $ee =  json_decode($output);
	$idd = $ee->id;
	$amount = doubleval($amount)/doubleval('100');
	$amount = strval($amount);
	$query = mysqli_query($con,"INSERT INTO `tbl_bthawk_payment_log`(`distributor_id`,`razorpay_order_id`, `status`, `total_amount`,`source`) VALUES ('$distributor_id','$idd','Pending','$amount','App')");
	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
	echo json_encode($response);
}	
?>