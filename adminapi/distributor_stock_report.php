<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['cdate']) && isset($_POST['dist_category']))
{
	$cdate = $_POST['cdate'];
	$dist_category = $_POST['dist_category'];
	$temp_string=explode("-",$cdate);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate=date("Y-m-d",$temp_date2);
	
	$type_explode=explode('+',$dist_category);
	$type_array='';
	for($i=0;$i<sizeof($type_explode);$i++)
	{
		if($type_explode[$i]!='')
		{
			if($i==0)
				$type_array="'".$type_explode[$i]."'";
			else
				$type_array=$type_array.",'".$type_explode[$i]."'";
			if($type_explode[$i]=="Service")
				$type_array=$type_array.",'Payout'";
		}
	}
	$ver = $_POST['distributor_id'];
	$check_author = mysqli_query($con,"select performa_applicable from tbl_distributor where distributor_id='$ver'");
	while($fetch_check = mysqli_fetch_array($check_author))
	{
		$performa_applicable=$fetch_check['performa_applicable'];
	}
	
	$bill_financial_year=mysqli_query($con,"SELECT * FROM tbl_distributor_previous_data_record where start_date<='$cdate' && end_date>='$cdate'");
	if(mysqli_num_rows($bill_financial_year)>0)
	{
		while($f_data_fetch=mysqli_fetch_assoc($bill_financial_year))
		{
			$extra_link1=$f_data_fetch['txn_table'];
			$extra_link2=$f_data_fetch['txn_detail_table'];
			$extra_link3=$f_data_fetch['purchase_txn_table'];
		}
	}
	
	
	$product=array();
	$select_product1 = mysqli_query($con,"select product_id,product_name,product_type from tbl_product where status='Active' and distributor_id='$ver' and product_type in ($type_array) and product_category!='BRANDING' and maintain_inventory='Yes' and consumable_raw_product='No'");
	$tamt_opening=0;
	$tamt_stockadd=0;
	$tamt_stocktrans=0;
	$tamt_stockrtn=0;
	$tamt_closing=0;
	$tamt_pdebitqty=0;
	$tsmt_pcreditqty=0;
	while($fetch_product1=mysqli_fetch_array($select_product1))
	{
		$tamt_opening=0;
		$tamt_closing=0;
		$tamt_preturn=0;
		$total_c_qty=0;
		$tamt_pdebitqty=0;
		$tsmt_pcreditqty=0;
		$product_id=$fetch_product1['product_id'];
		
		$product_name=$fetch_product1['product_name'];
		$temp_closing_stock=0;
		$fos_user = mysqli_query($con,"select user_id from tbl_user where distributor_id='$ver' and status in ('Active','Deactive')");	
		while($fetch_product=mysqli_fetch_assoc($fos_user))
		{
			$temp_uid=$fetch_product['user_id'];
			$fos_product_detail=mysqli_query($con,"SELECT quantity FROM tbl_user_stock where user_id='$temp_uid' and product_id='$product_id' and date<='$cdate' order by date DESC limit 1");
			if(mysqli_num_rows($fos_product_detail)>0)
			{     
				while($fetch_detail_fos=mysqli_fetch_array($fos_product_detail))
				{
					$temp_closing_stock=$temp_closing_stock+$fetch_detail_fos['quantity'];
				} 
			}
		}
		$product_preturn=mysqli_query($con,"SELECT return_quantity FROM tbl_purchase_return_transaction where transaction_date='$cdate' and distributor_id='$ver' and product_id='$product_id'");
		if(mysqli_num_rows($product_preturn)>0)
		{  
			while($fetch_pdetail=mysqli_fetch_assoc($product_preturn))
			{
				$tamt_preturn=$tamt_preturn+$fetch_pdetail['return_quantity'];
			}
		}
		
		
		$product_debitnote=mysqli_query($con,"SELECT quantity FROM tbl_party_debit_note where transaction_date='$cdate' and distributor_id='$ver' and product_id='$product_id'");
		if(mysqli_num_rows($product_debitnote)>0)
		{  
			while($fetch_pdebit=mysqli_fetch_assoc($product_debitnote))
			{
				$tamt_pdebitqty=$tamt_pdebitqty+$fetch_pdebit['quantity'];
			}
		}	
		
		$product_creditnote=mysqli_query($con,"SELECT quantity FROM tbl_party_credit_note where transaction_date='$cdate' and distributor_id='$ver' and product_id='$product_id'");
		if(mysqli_num_rows($product_creditnote)>0)
		{  
			while($fetch_pcredit=mysqli_fetch_assoc($product_creditnote))
			{
				$tsmt_pcreditqty=$tsmt_pcreditqty+$fetch_pcredit['quantity'];
			}
		}
													
		$product_detail=mysqli_query($con,"SELECT date,opening_stock,closing_stock FROM tbl_distributor_stock where date<='$cdate' and distributor_id='$ver' and product_id='$product_id' order by date DESC limit 1");
		if(mysqli_num_rows($product_detail)>0)
		{  
			while($fetch_detail=mysqli_fetch_array($product_detail))
			{
				if($fetch_detail['date']==$cdate)
				{
					$tamt_opening=$fetch_detail['opening_stock'];
					$tamt_closing=$fetch_detail['closing_stock'];
				}
				else
				{
					$tamt_opening=$fetch_detail['closing_stock'];
					$tamt_closing=$fetch_detail['closing_stock'];
				}
			}
		}
																
		$stockin_detail=mysqli_query($con,"SELECT sum(quantity) as tadd,sum(free_qty) as t_fqty FROM ".$extra_link3." where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' and txn_type='Add' group by product_id");
		$temp_stockin=0;
		if(mysqli_num_rows($stockin_detail)>0)
		{     
			while($fetch_stockin=mysqli_fetch_array($stockin_detail))
			{
				$temp_stockin = $temp_stockin + $fetch_stockin['tadd'] + $fetch_stockin['t_fqty'];
			}
			$tamt_stockadd=$temp_stockin;
		}
		else
		{
			$tamt_stockadd=$temp_stockin;
		}
		
		$stockin_detail_current = mysqli_query($con, "SELECT sum(quantity) as tadd,sum(free_qty) as t_fqty FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and product_id='$product_id' and transaction_date='$cdate' and txn_type='Add' group by product_id");
		if (mysqli_num_rows($stockin_detail_current) > 0) {
			while ($fetch_stockin = mysqli_fetch_array($stockin_detail_current)) {
					$temp_stockin = $temp_stockin + $fetch_stockin['tadd'] + $fetch_stockin['t_fqty'];
			}
			$tamt_stockadd = $temp_stockin;
		} else {
			$tamt_stockadd = $temp_stockin;
		}
	
		$stockin_detail_new=mysqli_query($con,"SELECT sum(quantity) as tadd FROM tbl_distributor_stock_add_reduce where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' and txn_type='Add' group by product_id");
		if(mysqli_num_rows($stockin_detail_new)>0)
		{     
			while($fetch_stockin=mysqli_fetch_array($stockin_detail_new))
			{
				$tamt_stockadd=$tamt_stockadd+$fetch_stockin['tadd'];
			}
		}
		
		$stockout_detail=mysqli_query($con,"SELECT sum(quantity) as ttrans FROM ".$extra_link3." where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' and txn_type='Transfer' group by product_id");
		$temp_stockout=0;
		if(mysqli_num_rows($stockout_detail)>0)
		{     
			while($fetch_stockout=mysqli_fetch_array($stockout_detail))
			{
				$temp_stockout=$temp_stockout+$fetch_stockout['ttrans'];
			}
			$tamt_stocktrans=$temp_stockout;
		}
		else
		{
			$tamt_stocktrans=$temp_stockout;
		}
																
		$stockout_return=mysqli_query($con,"SELECT sum(quantity) as trtn FROM ".$extra_link3." where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' and txn_type='Return' group by product_id");
		$temp_stockreturn=0;
		if(mysqli_num_rows($stockout_return)>0)
		{     
			while($fetch_stockreturn=mysqli_fetch_array($stockout_return))
			{
				$temp_stockreturn=$temp_stockreturn+$fetch_stockreturn['trtn'];
			}
			$tamt_stockrtn=$temp_stockreturn;
		}
		else
		{
			$tamt_stockrtn=$temp_stockreturn;
		}
		
		
		
		$stockout_sale = mysqli_query($con, "SELECT " . $extra_link2 . ".quantity, " . $extra_link2 . ".free_qty FROM " . $extra_link1 . ", " . $extra_link2 . " where " . $extra_link1 . ".transaction_id = " . $extra_link2 . ".transaction_id and " . $extra_link1 . ".transaction_date='$cdate' and " . $extra_link1 . ".converted_transaction_id='' and " . $extra_link1 . ".performa_invoice='No' and " . $extra_link1 . ".transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and " . $extra_link2 . ".product_id='$product_id' and (" . $extra_link1 . ".source!='' or  " . $extra_link1 . ".txn_service_type='Retail') and " . $extra_link1 . ".invoice_add_date='0000-00-00' and ".$extra_link1.".bill_mode!='Auto'");
		$temp_stock_sale = 0;
		if (mysqli_num_rows($stockout_sale) > 0) {
			while ($fetch_stock_sale = mysqli_fetch_array($stockout_sale)) {
				$temp_stock_sale = $temp_stock_sale + $fetch_stock_sale['quantity'] + $fetch_stock_sale['free_qty'];
			}
		}
													
		if($extra_link1!='tbl_party_transaction')
		{
			$stockout_sale_current = mysqli_query($con, "SELECT tbl_party_transaction_detail.quantity, tbl_party_transaction_detail.free_qty FROM tbl_party_transaction, tbl_party_transaction_detail where tbl_party_transaction.transaction_id = tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_date ='$cdate' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.performa_invoice='No' and tbl_party_transaction.transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and tbl_party_transaction_detail.product_id='$product_id' and (tbl_party_transaction.source!='' or  tbl_party_transaction.txn_service_type='Retail') and tbl_party_transaction.invoice_add_date='0000-00-00' and tbl_party_transaction.bill_mode!='Auto'");
			if (mysqli_num_rows($stockout_sale_current) > 0) {
				while ($fetch_stock_sale = mysqli_fetch_array($stockout_sale_current)) {
					$temp_stock_sale = $temp_stock_sale + $fetch_stock_sale['quantity'] + $fetch_stock_sale['free_qty'];
				}
			}
		}
													
		$stockout_sale_1 = mysqli_query($con, "SELECT " . $extra_link2 . ".quantity, " . $extra_link2 . ".free_qty FROM " . $extra_link1 . ", " . $extra_link2 . " where " . $extra_link1 . ".transaction_id = " . $extra_link2 . ".transaction_id and " . $extra_link1 . ".invoice_add_date='$cdate' and " . $extra_link1 . ".converted_transaction_id='' and " . $extra_link1 . ".performa_invoice='No' and " . $extra_link1 . ".transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and " . $extra_link2 . ".product_id='$product_id' and (" . $extra_link1 . ".source!='' or  " . $extra_link1 . ".txn_service_type='Retail') and ".$extra_link1.".bill_mode!='Auto'");
		if (mysqli_num_rows($stockout_sale_1) > 0) {
			while ($fetch_stock_sale = mysqli_fetch_array($stockout_sale_1)) {
				$temp_stock_sale = $temp_stock_sale + $fetch_stock_sale['quantity'] + $fetch_stock_sale['free_qty'];
			}
		}
													
		if($extra_link1!='tbl_party_transaction')
		{
			$stockout_sale_current_2 = mysqli_query($con, "SELECT tbl_party_transaction_detail.quantity, tbl_party_transaction_detail.free_qty FROM tbl_party_transaction, tbl_party_transaction_detail where tbl_party_transaction.transaction_id = tbl_party_transaction_detail.transaction_id and tbl_party_transaction.invoice_add_date ='$cdate' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.performa_invoice='No' and tbl_party_transaction.transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and tbl_party_transaction_detail.product_id='$product_id' and (tbl_party_transaction.source!='' or  tbl_party_transaction.txn_service_type='Retail') and tbl_party_transaction.bill_mode!='Auto'");
			if (mysqli_num_rows($stockout_sale_current_2) > 0) {
				while ($fetch_stock_sale = mysqli_fetch_array($stockout_sale_current_2)) {
					$temp_stock_sale = $temp_stock_sale + $fetch_stock_sale['quantity'] + $fetch_stock_sale['free_qty'];
				}
			}
		}

		$stockout_sale2 = mysqli_query($con, "SELECT tbl_party_transaction_consumable_detail.total_qty_consume FROM " . $extra_link1 . "," . $extra_link2 . ",tbl_party_transaction_consumable_detail where " . $extra_link1 . ".transaction_id = " . $extra_link2 . ".transaction_id and ".$extra_link2.".transaction_detail_id= tbl_party_transaction_consumable_detail.transaction_detail_id and  tbl_party_transaction_consumable_detail.consume_product_id='$product_id' and   " . $extra_link1 . ".transaction_date='$cdate' and " . $extra_link1 . ".transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and (" . $extra_link1 . ".source!='' or  " . $extra_link1 . ".txn_service_type='Retail')");
		if (mysqli_num_rows($stockout_sale2) > 0) {
			while ($fetch_stock_sale1 = mysqli_fetch_array($stockout_sale2)) {
				$temp_stock_sale = $temp_stock_sale + $fetch_stock_sale1['total_qty_consume'];
			}
		}
		
		$mat_issue_detail=mysqli_query($con,"SELECT sum(quantity) as trtn FROM tbl_distributor_material_transfer where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' group by product_id");
		$temp_matissue=0;
		if(mysqli_num_rows($mat_issue_detail)>0)
		{     
			while($fetch_matissue=mysqli_fetch_array($mat_issue_detail))
			{
				$temp_matissue=$temp_matissue+$fetch_matissue['trtn'];
			}
		}
													
		$mat_received_detail=mysqli_query($con,"SELECT sum(quantity) as trtn FROM tbl_distributor_material_received where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' group by product_id");
		$temp_matreceived=0;
		if(mysqli_num_rows($mat_received_detail)>0)
		{     
			while($fetch_matissue=mysqli_fetch_array($mat_received_detail))
			{
				$temp_matreceived=$temp_matreceived+$fetch_matissue['trtn'];
			}
		}
													
		$damage_detail=mysqli_query($con,"SELECT sum(quantity) as damageqty FROM tbl_distributor_damage_stock_master where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' and status='Complete' group by product_id");
		$temp_damagestock=0;
		if(mysqli_num_rows($damage_detail)>0)
		{     
			while($fetch_damagestock=mysqli_fetch_array($damage_detail))
			{
				$temp_damagestock=$temp_damagestock+$fetch_damagestock['damageqty'];
			}
		}
		
		$damage_detail_new=mysqli_query($con,"SELECT sum(quantity) as tadd FROM tbl_distributor_stock_add_reduce where distributor_id='$ver' and product_id='$product_id' and transaction_date='$cdate' and txn_type='Reduce' group by product_id");
		if(mysqli_num_rows($damage_detail_new)>0)
		{     
			while($fetch_stockin=mysqli_fetch_array($damage_detail_new))
			{
				$temp_damagestock=$temp_damagestock+$fetch_stockin['tadd'];
			}
		}
		
		$stockcancel_sale = mysqli_query($con, "SELECT tbl_bill_cancel_detail.quantity, tbl_bill_cancel_detail.free_qty FROM tbl_bill_cancel, tbl_bill_cancel_detail where tbl_bill_cancel.transaction_id = tbl_bill_cancel_detail.transaction_id and tbl_bill_cancel.invoice_add_date='$cdate' and tbl_bill_cancel.converted_transaction_id='' and tbl_bill_cancel.transaction_from in (select user_id from tbl_user where `distributor_id`='$ver') and tbl_bill_cancel_detail.product_id='$product_id' and tbl_bill_cancel.source='' and tbl_bill_cancel.stock_add='Admin'");
		$temp_stockcancel_sale = 0;
		if (mysqli_num_rows($stockcancel_sale) > 0) {
			while ($fetch_stock_sale = mysqli_fetch_array($stockcancel_sale)) {
				$temp_stockcancel_sale = $temp_stockcancel_sale + $fetch_stock_sale['quantity'] + $fetch_stock_sale['free_qty'];
			}
		}
		
		$stockcancel_sale = mysqli_query($con, "SELECT tbl_bill_cancel_detail.quantity, tbl_bill_cancel_detail.free_qty FROM tbl_bill_cancel, tbl_bill_cancel_detail where tbl_bill_cancel.transaction_id = tbl_bill_cancel_detail.transaction_id and tbl_bill_cancel.transaction_date='$cdate' and tbl_bill_cancel.converted_transaction_id='' and tbl_bill_cancel.transaction_from in (select user_id from tbl_user where `distributor_id`='$ver') and tbl_bill_cancel_detail.product_id='$product_id' and tbl_bill_cancel.source='' and tbl_bill_cancel.stock_add='Admin' and tbl_bill_cancel.invoice_add_date='0000-00-00'");
		if (mysqli_num_rows($stockcancel_sale) > 0) {
			while ($fetch_stock_sale = mysqli_fetch_array($stockcancel_sale)) {
				$temp_stockcancel_sale = $temp_stockcancel_sale + $fetch_stock_sale['quantity'] + $fetch_stock_sale['free_qty'];
			}
		}
		
		
		if($performa_applicable=='Yes') {
			$performa_detail=mysqli_query($con,"SELECT sum(quantity) as issueqty FROM tbl_party_transaction_detail_performa where product_id='$product_id' and insert_date='$cdate' and transaction_id in (select transaction_id from tbl_party_transaction_performa where status!='Deleted' and source='Web') group by product_id");
			$temp_performa_issue=0;
			if(mysqli_num_rows($performa_detail)>0)
			{     
				while($fetch_issuestock=mysqli_fetch_array($performa_detail))
				{
					$temp_performa_issue=$temp_performa_issue+$fetch_issuestock['issueqty'];
				}
			}
													
			$performa_detail=mysqli_query($con,"SELECT quantity,txn_type FROM tbl_party_transaction_detail_performa_other where product_id='$product_id' and insert_date='$cdate' and transaction_id in (select transaction_id from tbl_party_transaction_performa where status!='Deleted' and source='Web')");
			$temp_performa_received=0;
			if(mysqli_num_rows($performa_detail)>0)
			{     
				while($fetch_issuestock=mysqli_fetch_array($performa_detail))
				{
					if($fetch_issuestock['txn_type']=='Add')
						$temp_performa_issue=$temp_performa_issue+$fetch_issuestock['quantity'];
					else
						$temp_performa_received=$temp_performa_received+$fetch_issuestock['quantity'];
				}
			}
		}
		
		
		$product['product_type']=$fetch_product1['product_type'];
		$product['Product_Name']=$product_name;
		$product['Opening_Stock']=$tamt_opening;
		$product['Add']=$tamt_stockadd;
		$product['Transfer']=$tamt_stocktrans;
		$product['FSE_Return']=$tamt_stockrtn;
		$product['Purchase_Return']=$tamt_preturn;
		$product['debit_note']=$tamt_pdebitqty;
		$product['credit_note']=$tsmt_pcreditqty;
		$product['dist_sale']=$temp_stock_sale;
		$product['fse_bill_cancel_stock']=$temp_stockcancel_sale;
		$product['material_issue']=$temp_matissue;
		$product['material_received']=$temp_matreceived;
		$product['damage']=$temp_damagestock;
		
		if($performa_applicable=='Yes') {
			$product['performa_issue']=$temp_performa_issue;
			$product['performa_received']=$temp_performa_received;
		}
		
		$product['Closing_Stock']=(string)round($tamt_closing,2);
		$product['FSE_Stock']=(string)round($temp_closing_stock,2);
		$product['Total_Available_Stock']=(string)round($tamt_closing+$temp_closing_stock,2);
		$response['stockDetail'][]=$product;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>