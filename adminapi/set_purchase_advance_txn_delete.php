<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['receipt_txn_id']) && isset($_POST['distributor_id']))
{
	$get_txn_id1 = $_POST['receipt_txn_id'];
	$session_dist_ver = $_POST['distributor_id'];
	$actual_dsr_requirement=$_POST['dsr_requirement'];
	$res = mysqli_query($con,"select * from tbl_purchase_advance_txn_detail where receipt_txn_id='$get_txn_id1'");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		extract($fetch_product);
		$resd1 = mysqli_query($con,"update tbl_purchase_advance_txn_detail set status='Deleted' where receipt_txn_id='$get_txn_id1'");
		if($resd1)
		{
			include("sale-purchase-balance-effect-class.php");
			$balanceCollection=new Collectionbalance();
			$collectionsdata=$balanceCollection->purchasecollection($session_dist_ver,$total_amount,$receipt_date,$party_id);
			if($actual_dsr_requirement=="Yes")
			{
				include("cash_bank_effect_class.php");
				if($payment_mode=='Cash')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->cashcollection($session_dist_ver,$total_amount,$receipt_date);
				}
				else if($payment_mode=='Online')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->bankcollection($session_dist_ver,$bank_id,$total_amount,$receipt_date);
				}		
			}				
			$response['success']='1';
			$response['message']="Receipt Successfully Deleted";
		}
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing!!";
}	
echo json_encode($response);
?>