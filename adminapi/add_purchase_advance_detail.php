<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['partydetail']) && isset($_POST['distributor_id']) && isset($_POST['pmode']) && isset($_POST['tot_amt_val']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$dadate  = date("Y-m-d");
	$da = isset($_POST['receiptdate']) ? $_POST['receiptdate'] : $dadate;
	$scri =$da." ".$scro;
	$pp_id=$_POST['partydetail'];
	$dist_dsr_require=$_POST['dist_dsr_require'];
	$pmode = $_POST['pmode'];
	$remark=$_POST['remark'];
	$deposit_bank_id = isset($_POST['bnk_id']) ? $_POST['bnk_id'] : '0';
	$cheque_no = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	$amount = $_POST['tot_amt_val'];
	$final_amt=round($amount);
								
	$query1=mysqli_query($con,"INSERT INTO `tbl_purchase_advance_txn_detail`(`distributor_id`, `party_id`, `receipt_date`, `receipt_time`, `payment_mode`, `total_amount`, `bank_id`, `cheque_no`, `cheque_date`, `adjust_amount`, `status`, `remark`, `source`) VALUES ('$session_dist_ver', '$pp_id','$da','$scro','$pmode','$final_amt','$deposit_bank_id','$cheque_no','$cheque_date','0','Complete','$remark','App')");
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT OPERATION,Add Purchase Advance Detail#Admin(INSERT)tbl_purchase_advance_txn_detail', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	if($query1)
	{
		include("sale-purchase-balance-effect-class.php");
		$balanceCollection=new Collectionbalance();
		$collectionsdata=$balanceCollection->purchaseminuscollection($session_dist_ver,$final_amt,$da,$pp_id);
		if($dist_dsr_require=='Yes')
		{
			include("cash_bank_effect_class.php");
			if($pmode=='Cash')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasecashcollection($session_dist_ver,$final_amt,$da);
			}
			else
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasebankcollection($session_dist_ver,$deposit_bank_id,$final_amt,$da);
			}
		}
	}
	$response['success']='1';
	$response['message']="Advance Transaction successfully Inserted";
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>