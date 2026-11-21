<?php
include("../../connect.php");
$response = array();
if(isset($_POST['detail_id']) && isset($_POST['distributor_id']))
{
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d"); 
	$cash_receipt_id=$_POST['detail_id'];
	$select_product = mysqli_query($con,"select * from tbl_other_cash_txn_master_detail where detail_id='$cash_receipt_id' and status='Complete'");
	if(mysqli_num_rows($select_product)>0)
	{
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$cash_txn_id=$fetch_product['transaction_id'];
			$receipt_amt=$fetch_product['total_amount'];
			$ins_date=$fetch_product['receipt_date'];
			$deposit_bank_id=$fetch_product['bank_id'];
			$res_txn = mysqli_query($con,"select txn_type from tbl_other_cash_txn_master where transaction_id='$cash_txn_id' and distributor_id='$session_dist_ver'");
			$fetch_data=mysqli_fetch_assoc($res_txn);
			$txn_type_val=$fetch_data['txn_type'];
			$updt=mysqli_query($con,"UPDATE `tbl_other_cash_txn_master_detail` SET `status`='Delete' WHERE `detail_id`='$cash_receipt_id' AND `transaction_id`='$cash_txn_id' AND `status`='Complete'");
			if($updt)
			{
				$uq=mysqli_query($con,"UPDATE tbl_other_cash_txn_master SET receive_pay_amount=round(receive_pay_amount-'$receipt_amt',2) where transaction_id ='$cash_txn_id'");
				include("cash_bank_effect_class.php");
				if($txn_type_val=='To Receive')
				{
					if($deposit_bank_id>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasebankcollection($session_dist_ver,$deposit_bank_id,$receipt_amt,$ins_date);
					}
					else
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasecashcollection($session_dist_ver,$receipt_amt,$ins_date);
					}
				}
				else
				{
					if($deposit_bank_id>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->bankcollection($session_dist_ver,$deposit_bank_id,$receipt_amt,$ins_date);
					}
					else
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->cashcollection($session_dist_ver,$receipt_amt,$ins_date);
					}
				}
				$response['success']='1';
				$response['details']="Transaction Successfully Cancelled";								
			}
			else
			{
				$response['success']='0';
				$response['details']="Transaction Not Cancelled";		
			}
		}
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>