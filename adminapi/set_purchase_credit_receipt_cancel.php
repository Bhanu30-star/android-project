<?php
include("../../connect.php");
$response = array();
if(isset($_POST['payment_id']) && isset($_POST['dsr_requirement']) && isset($_POST['distributor_id']) && isset($_POST['payment_id']))
{
	$bill_uid=$_POST['unique_bill'];
	$session_dist_ver=$_POST['distributor_id'];
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
	$bill_no_id=$_POST['bill_no'];
	$sid_id=$_POST['payment_id'];
	$actual_dsr_requirement=$_POST['dsr_requirement'];
	$res_payment = mysqli_query($con,"SELECT * FROM tbl_purchase_payment_transaction where distributor_id='$session_dist_ver' and unique_bill='$bill_uid' and bill_no='$bill_no_id' and payment_id='$sid_id'");
	if(mysqli_num_rows($res_payment)>0)
	{ 
		while($fetch_data=mysqli_fetch_assoc($res_payment))
		{
			$pmode=$fetch_data['payment_mode'];
			$cheq_bank_id=$fetch_data['bank_id'];
			$adjust_id=$fetch_data['adjust_by_receipt_bill_no'];
			$remark_data=$fetch_data['remark'];
			$query = mysqli_query($con,"INSERT INTO `tbl_purchase_payment_transaction_cancel`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`, `payment_mode`, `unique_bill`, `bill_no`, `cheque_no`, `bank_name`, `cheque_date`, `payment_type`, `status`, `remark`,`insert_date`,`party_id`,`bank_id`,`receive_disc_amt`) VALUES ('$session_dist_ver','".$fetch_data['payment_date']."','".$fetch_data['payment_time']."','".$fetch_data['total_amount']."','".$fetch_data['payment_mode']."','".$fetch_data['unique_bill']."','".$fetch_data['bill_no']."','".$fetch_data['cheque_no']."','".$fetch_data['bank_name']."','".$fetch_data['cheque_date']."','".$fetch_data['payment_type']."','".$fetch_data['status']."','".$fetch_data['remark']."','$cdate','".$fetch_data['party_id']."','".$fetch_data['bank_id']."','".$fetch_data['receive_disc_amt']."')");
			
			if($fetch_data['party_id']>0)
			{
				$actual_add_paid_pay=$fetch_data['total_amount']+$fetch_data['receive_disc_amt'];
				$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt=round(adjusted_outstanding_amt-'$actual_add_paid_pay',2) where distributor_id='$session_dist_ver' and purchase_party_id='".$fetch_data['party_id']."'");
			}
			else
			{
				$actual_add_paid_pay=$fetch_data['total_amount'];
				$res_update = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id'");
				while($fetch_product=mysqli_fetch_assoc($res_update))
				{
					$update_txn_id=$fetch_product['transaction_id'];
					$p_bill_party=$fetch_product['party_id'];
					$actual_add_paid=$fetch_product['pay_amount']-$fetch_data['total_amount']-$fetch_data['receive_disc_amt'];
					if($actual_add_paid<=0)
						$actual_add_paid=0;
					$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$scri',pay_amount='$actual_add_paid' where payment_mode='Credit' and distributor_id='$session_dist_ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id' and transaction_id='$update_txn_id'");
				}
			}
			if($query)
			{
				$actual_update_paid=$fetch_data['total_amount']+$fetch_data['receive_disc_amt'];
				
				$res_update = mysqli_query($con,"delete FROM tbl_purchase_payment_transaction where distributor_id='$session_dist_ver' and unique_bill='$bill_uid' and bill_no='$bill_no_id' and payment_id='$sid_id'");
				
				if(($p_bill_party>0 || $fetch_data['party_id']>0) && $pmode!='Adjustment')
				{
					
					include("sale-purchase-balance-effect-class.php");
					$CashCollection=new Collectionbalance();
					if($p_bill_party>0)
						$collections=$CashCollection->purchasecollection($session_dist_ver,$actual_update_paid,$da,$p_bill_party);
					else
						$collections=$CashCollection->purchasecollection($session_dist_ver,$actual_update_paid,$da,$fetch_data['party_id']);
				}
				
				if($actual_dsr_requirement=="Yes")
				{
					include("cash_bank_effect_class.php");
					if($pmode=='Cash')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->cashcollection($session_dist_ver,$actual_add_paid_pay,$da);
					}
					else if($pmode=='Online')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->bankcollection($session_dist_ver,$cheq_bank_id,$actual_add_paid_pay,$da);
					}
				}
				$response['success']='1';
				$response['details']="Receipt Successfully Cancelled";
			}
			else
			{
				$response['success']='0';
				$response['details']="Bill Not Cancelled";
			}
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Txn Not Exists.Please check and try again later!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>