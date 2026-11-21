<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$bill_no_id = $_POST['bill_no'];
	$bill_uid = $_POST['unique_bill'];
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$res_payment = mysqli_query($con,"SELECT * FROM tbl_purchase_payment_transaction where distributor_id='$session_dist_ver' and unique_bill='$bill_uid' and bill_no='$bill_no_id' order by payment_date asc");	
	$purchasebook=array();
	if(mysqli_num_rows($res_payment)>0)
	{
		while($fetch_product2=mysqli_fetch_assoc($res_payment))
		{
			$purchasebook['payment_id']=$fetch_product2['payment_id'];
			$purchasebook['payment_mode']=$fetch_product2['payment_mode'];
			$purchasebook['payment_date']=$fetch_product2['payment_date'];
			$purchasebook['total_amount']=$fetch_product2['total_amount'];
			$purchasebook['bank_name']=$fetch_product2['bank_name'];
			$purchasebook['cheque_no']=$fetch_product2['cheque_no'];
			$purchasebook['cheque_date']=$fetch_product2['cheque_date'];
			$response['purchasebook'][]=$purchasebook;
		}
		$response['success']='1';
		$response['details']="Bill Payment Txn Successfully Fetch";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>