<?php
$response = array();
include("../../connect.php");
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'application/json') !== false) {
	$rawData = file_get_contents("php://input");

	$post = json_decode($rawData, true);

	if ($post === null) {
		echo json_encode(["error" => "Invalid JSON received"]);
		exit;
	}
} elseif (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
	$post = $_POST;
} else {
	$post = $_POST;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['key_pid']) && isset($post['payment_mode']) && isset($post['distributor_id'])) 
{
	$dis_id = $post['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$invoice_date = isset($post['invoice_date']) ? $post['invoice_date'] : $da;
	$p_client = $post['key_pid'];
	$gstconfig = isset($post['gstconfig']) ? $post['gstconfig'] : '';
	$pmode = $post['payment_mode'];
	$toder = $post['total_order'];
	$request_id = substr(uniqid(rand(), 1), 0, 7) . '_' . uniqid() . '_' . substr(rand(), 1, 3);
	$check_partybill=mysqli_query($con,"select * from tbl_bill_generation_process_support where distributor_id ='$dis_id' and party_id='$p_client' and bill_date='$invoice_date' and status in ('Pending','Complete')");
	if(mysqli_num_rows($check_partybill)==0)
	{
		$ik=0;
		$json_a=json_decode($toder, true);     
		foreach ($json_a as $person_a)
		{
			$productid=$person_a['product_id'];
			$amount = $person_a['amount'];
			$res = mysqli_query($con,"INSERT INTO `tbl_bill_generation_process_support`(`distributor_id`, `party_id`, `product_id`, `amount`, `tax_type`, `bill_date`, `payment_mode`, `status`,`request_id`) VALUES ('$dis_id','$p_client','$productid','$amount','$gstconfig','$invoice_date','$pmode','Pending','$request_id')");
			if($res)
				$ik++;
		}
		if($ik>0)
		{
			$response['success'] = 1;
			$response['details'] = "Successfully Added";
		}
		else
		{
			$response['success'] = 0;
			$response['details'] = "Submitted detail is not correct";
		}
	}
	else
	{
		$response['success'] = 0;
		$response['details'] = "Bill detail Already Added";
	}
	
} else {
	$response['success'] = 0;
	$response['details'] = "Required Field Missing...!!";
}
echo json_encode($response);
?>
