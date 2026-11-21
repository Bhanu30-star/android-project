<?php
include("../../connect.php");
$response = array();
if(isset($_POST['pmode']) && isset($_POST['paid_amt']) && isset($_POST['billamt']) && isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{					
	$bill_uid = isset($_POST['unique_bill']) ? $_POST['unique_bill'] : '';
	$bill_no_id = isset($_POST['bill_no']) ? $_POST['bill_no'] : '';
	$pmode=$_POST['pmode'];
	$pmtype = isset($_POST['pmtype']) ? $_POST['pmtype'] : '';
	$cheque_bank = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_number = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : $cdate;
	$cheq_bank_id=isset($_POST['bank_detail']) ? $_POST['bank_detail'] : '0';
	$party_uid = isset($_POST['partyid']) ? $_POST['partyid'] : '0';
	$paid_amt=$_POST['paid_amt'];	
	$discamt=$_POST['disc_amt'];
	$billamt=$_POST['billamt']-$discamt;
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');	
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	if($party_uid>0)
	{
		$bill_uid='';
		$bill_no_id='';
	}
	
	if($billamt==$paid_amt)
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`, `payment_mode`, `unique_bill`, `bill_no`, `cheque_no`, `bank_name`, `cheque_date`, `payment_type`,`status`,`party_id`,`bank_id`, `receive_disc_amt`)values('$ver','$cdate','$scri','$paid_amt','$pmode','$bill_uid','$bill_no_id','$cheque_number','$cheque_bank','$cheque_date','$pmtype','Complete','$party_uid','$cheq_bank_id','$discamt')");
		if($party_uid>0)
		{
			$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt=round(adjusted_outstanding_amt+'$paid_amt'+'$discamt') where distributor_id='$ver' and purchase_party_id='$party_uid'");
		}
		else
		{					
			$res_update = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id'");
			while($fetch_product=mysqli_fetch_assoc($res_update))
			{
				$update_txn_id=$fetch_product['transaction_id'];
				$p_bill_party=$fetch_product['party_id'];
				$check_bill_amt_val=$fetch_product['final_net_amt'];
				$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$da',pay_amount='$check_bill_amt_val',payment_status='Complete' where payment_mode='Credit' and distributor_id='$ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id' and transaction_id='$update_txn_id'");
			}
		}
	}
	else
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`, `payment_mode`, `unique_bill`, `bill_no`, `cheque_no`, `bank_name`, `cheque_date`, `payment_type`, `status`, `party_id`,`bank_id`, `receive_disc_amt`)values('$ver','$cdate','$scri','$paid_amt','$pmode','$bill_uid','$bill_no_id','$cheque_number','$cheque_bank','$cheque_date','$pmtype','Complete','$party_uid','$cheq_bank_id','$discamt')");	
		if($party_uid>0)
		{
			$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt = round(adjusted_outstanding_amt+'$paid_amt'+'$discamt') where distributor_id='$ver' and purchase_party_id='$party_uid'");
		}
		else
		{
			$my_paid_amt=$paid_amt+$discamt;			
			$res_update = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id'");
			while($fetch_product=mysqli_fetch_assoc($res_update))
			{
				$update_txn_id=$fetch_product['transaction_id'];
				$p_bill_party=$fetch_product['party_id'];
				$check_bill_amt_val=$fetch_product['final_net_amt']-$fetch_product['pay_amount'];
				if($check_bill_amt_val>0)
				{
					if($my_paid_amt>$check_bill_amt_val)
					{
						$actual_add_paid=$fetch_product['pay_amount']+$check_bill_amt_val;
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$da',pay_amount='$actual_add_paid' where payment_mode='Credit' and distributor_id='$ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id' and transaction_id='$update_txn_id'");
						$my_paid_amt=$my_paid_amt-$check_bill_amt_val;
					}
					else
					{
						$actual_add_paid=$fetch_product['pay_amount']+$my_paid_amt;
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$da',pay_amount='$actual_add_paid' where payment_mode='Credit' and distributor_id='$ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id' and transaction_id='$update_txn_id'");
						break;
					}
				}
			}
		}			
	}	

	if($p_bill_party>0 || $party_uid>0)
	{
		$actual_paid_amt=$paid_amt+$discamt;
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		if($p_bill_party>0)
			$collections=$CashCollection->purchaseminuscollection($ver,$actual_paid_amt,$cdate,$p_bill_party);
		else 
			$collections=$CashCollection->purchaseminuscollection($ver,$actual_paid_amt,$cdate,$party_uid);
	}
								

	
	include("cash_bank_effect_class.php");
	if($pmode=='Cash')
	{
		$CashCollection=new Collection();
		$collections=$CashCollection->purchasecashcollection($ver,$paid_amt,$cdate);
	}
	else if($pmode=='Online')
	{
		$CashCollection=new Collection();
		$collections=$CashCollection->purchasebankcollection($ver,$cheq_bank_id,$paid_amt,$cdate);
	}
	$response['success']='1';
	$response['details']="Payment Successfully Completed";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>