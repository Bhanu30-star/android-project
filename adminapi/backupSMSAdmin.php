<?php
include("../../connect.php"); 

$response = array();
if(isset($_POST['json_data']))
{
	$json_data = $_POST['json_data'];

	date_default_timezone_set('Asia/Calcutta');
	$cdate  = date("Y-m-d")." ".date('h:i:s');
	$t_date  = date("Y-m-d");
	$t_time  = date('H:i:s');
	$data = json_decode($json_data, true);

	for($j=0 ; $j<count($data) ; $j++) {
		$amount = $data[$j]['amount'];
		$stockFrom = $data[$j]['stockFrom'];
		$balance = $data[$j]['balance'];
		$transactionId = $data[$j]['transactionId'];
		$adminId = $data[$j]['adminId'];
		$txn_date = $data[$j]['txn_date'];
		$sender = $data[$j]['sender'];
		$rate = $data[$j]['rate'];
		$quantity = $data[$j]['qty'];
		$txn_time = $data[$j]['txn_time'];
		$operator = $data[$j]['operator'];
		$type = $data[$j]['type'];
		$commission = "";


		if($type == 'Purchase'){

			$query = mysqli_query($con,"INSERT INTO `tbl_backup_sms_purchase`(`txn_date`, `txn_time`, `stockFrom`,`amount`, `balance`, `transactionId`, `adminId`, `sender`,`quantity`, `commission_rate`,`operator`,`is_processed`,`created_at`) VALUES ('$txn_date', '$txn_time','$stockFrom','$amount','$balance','$transactionId','$adminId','$sender','$quantity','$rate','$operator','0', '$cdate');");
		}else{
			$query = mysqli_query($con,"INSERT INTO `tbl_backup_sms`(`txn_date`, `sender_no`, `trans_id`, `txn_time`, `amount`, `quantity`, `retailer_no`, `fse_id`,`operator`,`is_processed`, `created_at`) VALUES ('$txn_date', '$sender','$transactionId','$txn_time','$amount','$quantity','$stockFrom','0', '$operator','0', '$cdate');");
		}

		$qur = mysqli_query($con,"SELECT * from tbl_sms_lastSync where admin_id = '$adminId' and fse_id = '0'");

		if(mysqli_num_rows($qur)>0){     
			$qur = mysqli_query($con,"UPDATE `tbl_sms_lastSync` SET `sync_date`= '$t_date' , `sync_time`='$t_time' where admin_id= '$adminId' and fse_id = '0'");
		}
		else{
			$qur = mysqli_query($con,"INSERT INTO `tbl_sms_lastSync`(`admin_id`, `fse_id`, `sync_date`, `sync_time`, `created_at`) VALUES ('$adminId','0','$t_date','$t_time','$cdate')");
		}
	
	}

	$response['success']='1';
	$response['details']="Backup Successfull";
}
else{
	$response['success']='0';
	$response['details']="Unable to add sms. Data is incomplete";
}		
echo json_encode($response);
?>