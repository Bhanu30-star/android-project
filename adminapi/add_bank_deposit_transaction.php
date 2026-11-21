<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['bank_id']) && isset($_POST['distributor_id']) && isset($_POST['txn_no']) && isset($_POST['amount']) && isset($_POST['remark']))
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
	$bnk_id=$_POST['bank_id'];
	$bnk_id_affect=(int)$_POST['bnk_id_affect'];
	$txn_no=mysqli_real_escape_string($con,$_POST['txn_no']);
	$amunt=$_POST['amount'];
	$transfer=$_POST['txn_type'];
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
	$date=$_POST['txndate'];
	$cdate  = date("Y-m-d")." ".date('H:i:s');
	$scro=date("Y-m-d");
	$scri=date('H:i:s');
	if($transfer=="Deposite")
	{
		$insrt = mysqli_query($con,"INSERT INTO tbl_distributor_bank_transfer(distributor_id,bank_id, transaction_id, withdrawal_amt, transfer_amt,remark,txn_type,status,insert_date,bank_contra_id) VALUES ('$session_dist_ver','$bnk_id','$txn_no','0','$amunt','$remark','$transfer','Complete','$date','$bnk_id_affect')");
		$mode_type='Cash'; 
		if($bnk_id_affect>0) { $mode_type='Bank';  }
		if($bnk_id_affect>0){
			// Update Cash Collection Table
			// Update Cash Collection Table
			include("cash_bank_effect_class.php");
			$CashCollection=new Collection();
			$collections=$CashCollection->bankcollection($session_dist_ver,$bnk_id,$amunt,$date);
			$collections=$CashCollection->purchasebankcollection($session_dist_ver,$bnk_id_affect,$amunt,$date);
			// Update Cash Collection Table
			// Update Cash Collection Table
		} else {
			// Update Cash Collection Table
			// Update Cash Collection Table
			include("cash_bank_effect_class.php");
			$CashCollection=new Collection();
			$collections=$CashCollection->bankcollection($session_dist_ver,$bnk_id,$amunt,$date);
			$collections=$CashCollection->purchasecashcollection($session_dist_ver,$amunt,$date);
			// Update Cash Collection Table
			// Update Cash Collection Table
		}
	}
	else if($transfer=="Withdrawal")
	{
		$insrt = mysqli_query($con,"INSERT INTO tbl_distributor_bank_transfer(distributor_id, bank_id, transaction_id,withdrawal_amt,transfer_amt,remark,txn_type,status,insert_date) VALUES ('$session_dist_ver','$bnk_id','$txn_no','$amunt','0','$remark','$transfer','Complete','$date')");
		$mode_type='Bank'; 
		include("cash_bank_effect_class.php");
		$CashCollection=new Collection();
		$collections=$CashCollection->purchasebankcollection($session_dist_ver,$bnk_id,$amunt,$date);
		$collections=$CashCollection->cashcollection($session_dist_ver,$amunt,$date);
	} else if($transfer=="Cheque Withdrawal")
	{
		$insrt = mysqli_query($con,"INSERT INTO tbl_distributor_bank_transfer(distributor_id, bank_id, transaction_id,withdrawal_amt,transfer_amt,remark,txn_type,status,insert_date) VALUES ('$session_dist_ver','$bnk_id','$txn_no','$amunt','0','$remark','$transfer','Complete','$date')");
		$mode_type='Bank'; 
		include("cash_bank_effect_class.php");
		$CashCollection=new Collection();
		$collections=$CashCollection->purchasebankcollection($session_dist_ver,$bnk_id,$amunt,$date);
	} else if($transfer=="Cheque Deposite")
	{
		$insrt = mysqli_query($con,"INSERT INTO tbl_distributor_bank_transfer(distributor_id,bank_id, transaction_id,withdrawal_amt,transfer_amt,remark,txn_type,status,insert_date) VALUES ('$session_dist_ver','$bnk_id','$txn_no', '0','$amunt','$remark','$transfer','Complete','$date')");
		$mode_type='Bank'; 
		include("cash_bank_effect_class.php");
		$CashCollection=new Collection();
		$collections=$CashCollection->bankcollection($session_dist_ver,$bnk_id,$amunt,$date);
	}
	else if($transfer=="Cheque Bounce" || $transfer=="Other Tax Paid")
	{
		$insrt = mysqli_query($con,"INSERT INTO tbl_distributor_bank_transfer(distributor_id,bank_id,transaction_id,withdrawal_amt,transfer_amt, remark,txn_type, status,insert_date) VALUES ('$session_dist_ver','$bnk_id','$txn_no','$amunt','0','$remark','$transfer','Complete','$date')");
		$mode_type='Bank'; 
		include("cash_bank_effect_class.php");
		$CashCollection=new Collection();
		$collections=$CashCollection->purchasebankcollection($session_dist_ver,$bnk_id,$amunt,$date);
	}
	$response['success']='1';
	$response['message']="Bank Transaction successfully Inserted";
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>